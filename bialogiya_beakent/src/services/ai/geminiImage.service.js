// Image generation via Gemini's "Nano Banana" / Imagen models - same API key
// used everywhere else in this app.
// https://ai.google.dev/gemini-api/docs/image-generation

const { getCleanApiKey, getApiKeyAsync, resolveAiConfig } = require('../../config/gemini');

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';

/**
 * Generate an illustration for a prompt using Banana AI / Gemini.
 * Returns { buffer, mimeType }.
 */
const generateImage = async (prompt, centerId = null) => {
  const aiConfig = await resolveAiConfig(centerId);
  const apiKey = aiConfig?.apiKey || (await getApiKeyAsync()) || getCleanApiKey();
  if (!apiKey) throw new Error('AI API kaliti serverda sozlanmagan');
  const input = (prompt || '').trim().slice(0, 1500);
  if (!input) throw new Error('No prompt to generate an image from');

  // Attempt 1: Imagen 3 predict endpoint
  try {
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    const imagenRes = await fetch(imagenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: input }],
        parameters: { sampleCount: 1, aspectRatio: '16:9' },
      }),
    });
    if (imagenRes.ok) {
      const imgData = await imagenRes.json();
      const b64 = imgData.predictions?.[0]?.bytesBase64Encoded;
      if (b64) {
        return {
          buffer: Buffer.from(b64, 'base64'),
          mimeType: imgData.predictions?.[0]?.mimeType || 'image/png',
        };
      }
    }
  } catch (e) {
    console.warn('Imagen 3 predict attempt warning:', e.message);
  }

  // Attempt 2: Nano Banana / Gemini image generateContent models
  const candidateModels = [
    MODEL,
    'gemini-2.0-flash-exp',
    'gemini-2.5-flash-image',
  ].filter((v, idx, arr) => v && arr.indexOf(v) === idx);

  for (const modelName of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (part?.inlineData?.data) {
          return {
            buffer: Buffer.from(part.inlineData.data, 'base64'),
            mimeType: part.inlineData.mimeType || 'image/png',
          };
        }
      }
    } catch (e) {
      console.warn(`Model ${modelName} image attempt warning:`, e.message);
    }
  }

  throw new Error('Banana AI image generation returned no image data');
};

module.exports = { generateImage };
