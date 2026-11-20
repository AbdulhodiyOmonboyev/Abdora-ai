// Gemini is instructed not to use markdown in plain-text fields (see prompts.js),
// but LLMs occasionally slip anyway. This strips the common markers so raw
// "**word**" never reaches the UI, without needing a markdown renderer.
const stripMarkdown = (text) => {
  if (typeof text !== 'string') return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // **bold**
    .replace(/__(.*?)__/g, '$1')     // __bold__
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1') // *italic*
    .replace(/^#{1,6}\s+/gm, '')     // # headers
    .replace(/^[-*]\s+/gm, '')       // - bullets / * bullets
    .trim();
};

// Recursively applies stripMarkdown to every string in an object/array,
// leaving numbers, booleans, and structure untouched.
const sanitizeAiContent = (value) => {
  if (typeof value === 'string') return stripMarkdown(value);
  if (Array.isArray(value)) return value.map(sanitizeAiContent);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeAiContent(v)]));
  }
  return value;
};

/**
 * Robust JSON parser that handles code blocks (```json ... ```),
 * leading/trailing chatter, outermost { ... } or [ ... ],
 * trailing commas, and returns fallback value without throwing.
 */
const safeJsonParse = (text, fallback = null) => {
  if (!text || (typeof text !== 'string' && typeof text !== 'object')) {
    return fallback;
  }
  if (typeof text === 'object') {
    return text;
  }

  const cleaned = String(text).trim();
  if (!cleaned) return fallback;

  const tryParse = (str) => {
    if (!str || typeof str !== 'string') return null;
    try {
      return JSON.parse(str);
    } catch (_) {}
    try {
      // Remove trailing commas before closing braces/brackets
      return JSON.parse(str.replace(/,\s*([\]}])/g, '$1'));
    } catch (_) {}
    return null;
  };

  // 1. Direct parse attempt
  let parsed = tryParse(cleaned);
  if (parsed !== null) return parsed;

  // 2. Extract code block content if wrapped in markdown fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    const fenceContent = fenceMatch[1].trim();
    parsed = tryParse(fenceContent);
    if (parsed !== null) return parsed;

    const fB = fenceContent.indexOf('{');
    const lB = fenceContent.lastIndexOf('}');
    if (fB !== -1 && lB !== -1 && lB > fB) {
      parsed = tryParse(fenceContent.slice(fB, lB + 1));
      if (parsed !== null) return parsed;
    }

    const fBr = fenceContent.indexOf('[');
    const lBr = fenceContent.lastIndexOf(']');
    if (fBr !== -1 && lBr !== -1 && lBr > fBr) {
      parsed = tryParse(fenceContent.slice(fBr, lBr + 1));
      if (parsed !== null) return parsed;
    }
  }

  // 3. Strip leading/trailing backticks and fences
  const stripped = cleaned
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  parsed = tryParse(stripped);
  if (parsed !== null) return parsed;

  // 4. Outermost JSON object { ... } and array [ ... ]
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  const hasBraces = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace;
  const hasBrackets = firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket;

  if (hasBraces && hasBrackets) {
    if (firstBracket < firstBrace && lastBracket > lastBrace) {
      parsed = tryParse(cleaned.slice(firstBracket, lastBracket + 1));
      if (parsed !== null) return parsed;
      parsed = tryParse(cleaned.slice(firstBrace, lastBrace + 1));
      if (parsed !== null) return parsed;
    } else {
      parsed = tryParse(cleaned.slice(firstBrace, lastBrace + 1));
      if (parsed !== null) return parsed;
      parsed = tryParse(cleaned.slice(firstBracket, lastBracket + 1));
      if (parsed !== null) return parsed;
    }
  } else if (hasBraces) {
    parsed = tryParse(cleaned.slice(firstBrace, lastBrace + 1));
    if (parsed !== null) return parsed;
  } else if (hasBrackets) {
    parsed = tryParse(cleaned.slice(firstBracket, lastBracket + 1));
    if (parsed !== null) return parsed;
  }

  return fallback;
};

module.exports = { stripMarkdown, sanitizeAiContent, safeJsonParse };
