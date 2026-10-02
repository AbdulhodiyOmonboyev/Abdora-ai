const { GoogleGenerativeAI } = require('@google/generative-ai');
const { prisma } = require('./db');

let cachedAgent = null;
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

// Default fallback text model if none configured in DB
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.5-flash';

// Asynchronously load or refresh the agent/model/key from the AIAgent database table
const loadKeyFromDb = async () => {
  try {
    if (!prisma?.aIAgent) return null;

    // 1. Look for active agent with gemini/google
    let agent = await prisma.aIAgent.findFirst({
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
      select: { id: true, apiKey: true, model: true, provider: true, useCases: true },
    });

    // 2. If not found, look for ANY active agent
    if (!agent) {
      agent = await prisma.aIAgent.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, apiKey: true, model: true, provider: true, useCases: true },
      });
    }

    if (agent?.apiKey?.trim()) {
      cachedAgent = {
        id: agent.id,
        apiKey: sanitizeKey(agent.apiKey),
        model: (agent.model && agent.model !== 'default') ? agent.model.trim() : DEFAULT_TEXT_MODEL,
        provider: agent.provider || 'gemini',
      };
      lastCheckTime = Date.now();
      return cachedAgent;
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
  return cachedAgent?.apiKey || getEnvApiKey() || '';
};

// Explicit async getter when await is possible
const getApiKeyAsync = async () => {
  if (cachedAgent?.apiKey && (Date.now() - lastCheckTime < CACHE_TTL_MS)) {
    return cachedAgent.apiKey;
  }
  const dbAgent = await loadKeyFromDb();
  return dbAgent?.apiKey || getEnvApiKey() || '';
};

// Resolve specific AI config for a given Center (or global fallback)
const resolveAiConfig = async (centerId = null) => {
  // If centerId is provided, check Center.settings.aiConfig
  if (centerId && prisma?.center) {
    try {
      const center = await prisma.center.findUnique({
        where: { id: centerId },
        select: { settings: true },
      });
      const aiConfig = center?.settings?.aiConfig || {};

      // If center links to a specific AIAgent
      if (aiConfig.agentId) {
        const linkedAgent = await prisma.aIAgent.findUnique({
          where: { id: aiConfig.agentId },
        });
        if (linkedAgent && linkedAgent.isActive && linkedAgent.apiKey) {
          return {
            apiKey: sanitizeKey(linkedAgent.apiKey),
            model: (linkedAgent.model && linkedAgent.model !== 'default') ? linkedAgent.model.trim() : DEFAULT_TEXT_MODEL,
            provider: linkedAgent.provider || 'gemini',
            liveModel: aiConfig.liveModel || 'gemini-2.5-flash-native-audio-preview',
          };
        }
      }

      // If center has direct custom model or key
      if (aiConfig.model || aiConfig.apiKey) {
        const globalKey = await getApiKeyAsync();
        return {
          apiKey: sanitizeKey(aiConfig.apiKey) || globalKey,
          model: aiConfig.model || cachedAgent?.model || DEFAULT_TEXT_MODEL,
          provider: aiConfig.provider || 'gemini',
          liveModel: aiConfig.liveModel || 'gemini-2.5-flash-native-audio-preview',
        };
      }
    } catch (e) {
      console.warn('Error resolving center AI config:', e.message);
    }
  }

  // Fallback to active AIAgent or env
  const agent = cachedAgent || (await loadKeyFromDb());
  const apiKey = agent?.apiKey || getEnvApiKey();
  const model = agent?.model || DEFAULT_TEXT_MODEL;
  return {
    apiKey,
    model,
    provider: agent?.provider || 'gemini',
    liveModel: process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview',
  };
};

// Force cache update (called by ai-agents.controller or center settings update)
const updateCachedApiKey = (newAgent) => {
  if (newAgent && typeof newAgent === 'object') {
    cachedAgent = {
      apiKey: sanitizeKey(newAgent.apiKey),
      model: newAgent.model || DEFAULT_TEXT_MODEL,
      provider: newAgent.provider || 'gemini',
    };
    lastCheckTime = Date.now();
  } else if (typeof newAgent === 'string') {
    cachedAgent = {
      apiKey: sanitizeKey(newAgent),
      model: cachedAgent?.model || DEFAULT_TEXT_MODEL,
      provider: cachedAgent?.provider || 'gemini',
    };
    lastCheckTime = Date.now();
  } else {
    cachedAgent = null;
    loadKeyFromDb().catch(() => {});
  }
};

/**
 * getModel supports both:
 * 1) getModel(true/false) — backward compatible
 * 2) getModel({ jsonMode, centerId, model, apiKey }) — dynamic center-aware
 */
const getModel = (options = false) => {
  const jsonMode = typeof options === 'boolean' ? options : !!options?.jsonMode;
  const key = options?.apiKey || getCleanApiKey();
  const activeModel = options?.model || cachedAgent?.model || DEFAULT_TEXT_MODEL;

  const client = new GoogleGenerativeAI(key || 'unconfigured');
  return client.getGenerativeModel({
    model: activeModel,
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
  });
};

/**
 * getModelAsync: Asynchronously resolves Center settings or active AIAgent
 * ensures no hardcoded fallback is used when an active agent or center setting exists!
 */
const getModelAsync = async (options = false) => {
  const jsonMode = typeof options === 'boolean' ? options : !!options?.jsonMode;
  const centerId = options?.centerId || null;

  const config = await resolveAiConfig(centerId);
  const key = options?.apiKey || config.apiKey;
  const activeModel = options?.model || config.model || DEFAULT_TEXT_MODEL;

  const client = new GoogleGenerativeAI(key || 'unconfigured');
  return client.getGenerativeModel({
    model: activeModel,
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
  });
};

module.exports = {
  getModel,
  getModelAsync,
  resolveAiConfig,
  apiKey: getCleanApiKey(),
  getCleanApiKey,
  getApiKeyAsync,
  updateCachedApiKey,
  loadKeyFromDb,
};

