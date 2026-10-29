const { prisma } = require('../../config/db');

const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';
const DEFAULT_MODEL = 'eleven_multilingual_v2';

/**
 * Strips markdown symbols, code blocks, and HTML tags so speech synthesis sounds natural.
 */
const cleanTextForTts = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/```[\s\S]*?```/g, ' ') // code blocks
    .replace(/`([^`]+)`/g, '$1')     // inline code
    .replace(/<[^>]*>/g, ' ')        // html tags
    .replace(/#{1,6}\s+/g, '')       // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2')    // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^>\s+/gm, '')          // blockquotes
    .replace(/^[-*+]\s+/gm, '')      // list bullets
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Dynamically resolves the ElevenLabs API Key from:
 * 1. Process environment variables (ELEVENLABS_API_KEY or XI_API_KEY)
 * 2. Active AIAgent record with provider='elevenlabs'
 * 3. Specific Center's settings or any Center's settings
 */
const getElevenLabsKey = async (centerId = null) => {
  const envKey = (process.env.ELEVENLABS_API_KEY || process.env.XI_API_KEY || '').trim();
  if (envKey) return envKey;

  try {
    // 1. AIAgent table check
    if (prisma?.aIAgent) {
      const agent = await prisma.aIAgent.findFirst({
        where: {
          isActive: true,
          OR: [
            { provider: { contains: 'elevenlabs', mode: 'insensitive' } },
            { name: { contains: 'elevenlabs', mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        select: { apiKey: true },
      });
      if (agent?.apiKey?.trim()) return agent.apiKey.trim();
    }

    // 2. Specific Center settings check
    if (centerId && prisma?.center) {
      const center = await prisma.center.findUnique({
        where: { id: centerId },
        select: { settings: true },
      });
      const st = center?.settings || {};
      const key = st.elevenlabsApiKey || st.adminPrefs?.elevenlabsApiKey;
      if (key && typeof key === 'string' && key.trim()) return key.trim();
    }

    // 3. Fallback to any active Center's settings
    if (prisma?.center) {
      const anyCenter = await prisma.center.findFirst({
        where: { isActive: true },
        select: { settings: true },
      });
      const st = anyCenter?.settings || {};
      const key = st.elevenlabsApiKey || st.adminPrefs?.elevenlabsApiKey;
      if (key && typeof key === 'string' && key.trim()) return key.trim();
    }
  } catch (err) {
    console.warn('Error resolving ElevenLabs key from DB:', err.message);
  }

  return '';
};

/**
 * Throws a clean, user-friendly 400 error when ElevenLabs API key is missing.
 */
const requireKey = async (centerId = null) => {
  const key = await getElevenLabsKey(centerId);
  if (!key) {
    const err = new Error(
      "Ovozni klonlash uchun ElevenLabs API kaliti sozlanmagan. Iltimos, Super Admin sozlamalaridan ElevenLabs API kalitini kiriting."
    );
    err.statusCode = 400;
    err.status = 400;
    throw err;
  }
  return key;
};

/**
 * Parses ElevenLabs error responses into user-friendly messages.
 */
const parseElevenLabsError = (status, text) => {
  let message = text || 'ElevenLabs xizmatida xatolik yuz berdi';
  try {
    const parsed = JSON.parse(text);
    const detail = parsed.detail;
    if (typeof detail === 'object' && detail !== null) {
      message = detail.message || detail.status || text;
    } else if (typeof detail === 'string') {
      message = detail;
    } else if (parsed.message) {
      message = parsed.message;
    }
  } catch (_) {}

  const lower = message.toLowerCase();
  if (status === 401 || lower.includes('invalid api key')) {
    return "ElevenLabs API kaliti yaroqsiz yoki noto'g'ri kiritilgan.";
  }
  if (status === 429 || lower.includes('quota') || lower.includes('limit_exceeded')) {
    return "ElevenLabs hisobining belgilangan kvotasi (character limit) tugagan.";
  }
  if (lower.includes('voice_limit') || lower.includes('reach') && lower.includes('limit')) {
    return "ElevenLabs hisobida klonlangan ovozlar chegarasiga yetildi. Eski ovozlarni o'chiring.";
  }
  if (lower.includes('instant voice cloning') || lower.includes('subscription') || lower.includes('tier')) {
    return "ElevenLabs da Instant Voice Cloning uchun kamida Starter yoki pullik tarif talab qilinadi.";
  }
  if (lower.includes('sample') && (lower.includes('short') || lower.includes('long') || lower.includes('invalid'))) {
    return `Audio namuna sifati mos kelmadi: ${message}`;
  }

  return `ElevenLabs xatosi: ${message}`;
};

/**
 * Create an instant voice clone from an uploaded audio sample.
 * fileBuffer: Buffer of the sample audio (mp3/wav/m4a/webm...), 30s-3min of clean speech works best.
 * Returns the new voice_id.
 */
const cloneVoice = async (name, fileBuffer, mimeType, filename, centerId = null) => {
  const apiKey = await requireKey(centerId);

  // Sanitize filename and ensure valid audio extension
  let safeFilename = (filename || 'sample.mp3').replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!/\.(mp3|wav|m4a|webm|ogg|aac|flac)$/i.test(safeFilename)) {
    safeFilename += '.mp3';
  }

  const effectiveMime = mimeType || 'audio/mpeg';

  const form = new FormData();
  form.append('name', name);
  form.append('description', `Cloned teacher voice created on Abdora AI`);
  form.append('files', new Blob([fileBuffer], { type: effectiveMime }), safeFilename);

  const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('ElevenLabs clone error (HTTP ' + res.status + '):', detail);
    const friendlyMsg = parseElevenLabsError(res.status, detail);
    const err = new Error(friendlyMsg);
    err.statusCode = res.status === 401 ? 401 : (res.status === 429 ? 429 : 400);
    err.status = err.statusCode;
    throw err;
  }

  const data = await res.json();
  if (!data?.voice_id) {
    const err = new Error("ElevenLabs ovoz identifikatorini (voice_id) qaytarmadi.");
    err.statusCode = 502;
    throw err;
  }

  return data.voice_id;
};

/**
 * Deletes an existing cloned voice from ElevenLabs.
 */
const deleteVoice = async (voiceId, centerId = null) => {
  if (!voiceId) return;
  const apiKey = await getElevenLabsKey(centerId);
  if (!apiKey) return;

  await fetch(`${ELEVEN_BASE}/voices/${voiceId}`, {
    method: 'DELETE',
    headers: { 'xi-api-key': apiKey },
  }).catch((err) => {
    console.warn('ElevenLabs delete voice warning:', err.message);
  });
};

/**
 * Synthesize speech with a cloned (or any ElevenLabs) voice_id.
 * Returns a Buffer of MP3 audio.
 */
const synthesizeWithClonedVoice = async (text, voiceId, centerId = null) => {
  const apiKey = await requireKey(centerId);
  const input = cleanTextForTts(text).slice(0, 4500);
  if (!input) throw new Error("Sintez qilish uchun matn topilmadi.");

  const modelId = process.env.ELEVENLABS_MODEL || DEFAULT_MODEL;

  const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: input,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('ElevenLabs TTS error (HTTP ' + res.status + '):', detail);
    const friendlyMsg = parseElevenLabsError(res.status, detail);
    const err = new Error(friendlyMsg);
    err.statusCode = res.status === 401 ? 401 : (res.status === 429 ? 429 : 400);
    throw err;
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

module.exports = {
  cloneVoice,
  deleteVoice,
  synthesizeWithClonedVoice,
  getElevenLabsKey,
  cleanTextForTts,
};
