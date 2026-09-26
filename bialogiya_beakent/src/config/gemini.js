const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('./db');

let cachedDbKey = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds

const sanitizeKey = (k) => (k ? String(k).trim().replace(/^["']|["']$/g, '') : '');

const getEnvApiKey = () => {
  const key = process.env.GIMINI_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';
  return sanitizeKey(key);
};

// Asynchronously load or refresh the key from the AIAgent database table
const loadKeyFromDb = async () => {
  try {
    if (!prisma?.aIAgent) return null;
    const agent = await prisma.aIAgent.findFirst({
      where: {
        isActive: true,
        OR: [
          { provider: { contains: 'gemini', mode: 'insensitive' } },
          { provider: { contains: 'google', mode: 'insensitive' } },
          { name: { contains: 'gemini', mode: 'insensitive' } },
          { name: { contains: 'gimini', mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: { apiKey: true },
    });
    if (agent?.apiKey?.trim()) {
      cachedDbKey = sanitizeKey(agent.apiKey);
      lastCheckTime = Date.now();
      return cachedDbKey;
    }
    // Check if ANY active agent exists if provider didn't match
    const anyAgent = await prisma.aIAgent.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { apiKey: true },
    });
    if (anyAgent?.apiKey?.trim()) {
      cachedDbKey = sanitizeKey(anyAgent.apiKey);
      lastCheckTime = Date.now();
      return cachedDbKey;
    }
  } catch (err) {
    // If DB is still initializing or table not ready, don't crash
  }
  return null;
};

// Initial background load
setTimeout(() => {
  loadKeyFromDb().catch(() => {});
}, 1000);

// Synchronous getter: returns cached DB key or env key
const getCleanApiKey = () => {
  if (Date.now() - lastCheckTime > CACHE_TTL_MS) {
    lastCheckTime = Date.now();
    loadKeyFromDb().catch(() => {});
  }
  return cachedDbKey || getEnvApiKey() || '';
};

// Explicit async getter when await is possible
const getApiKeyAsync = async () => {
  if (cachedDbKey && (Date.now() - lastCheckTime < CACHE_TTL_MS)) {
    return cachedDbKey;
  }
  const dbKey = await loadKeyFromDb();
  return dbKey || getEnvApiKey() || '';
};

// Force cache update (called by ai-agents.controller when admin updates an agent)
const updateCachedApiKey = (newKey) => {
  if (newKey) {
    cachedDbKey = sanitizeKey(newKey);
    lastCheckTime = Date.now();
  } else {
    cachedDbKey = null;
    loadKeyFromDb().catch(() => {});
  }
};

const getModel = (jsonMode = false) => {
  const key = getCleanApiKey();
  const client = new GoogleGenerativeAI(key || 'unconfigured');
  return client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
  });
};

module.exports = {
  getModel,
  apiKey: getCleanApiKey(),
  getCleanApiKey,
  getApiKeyAsync,
  updateCachedApiKey,
  loadKeyFromDb,
};
