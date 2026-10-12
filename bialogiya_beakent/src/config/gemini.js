const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
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
const DEFAULT_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

// Map UI aliases to real Google Gemini API identifiers
const normalizeModelName = (modelName) => {
  if (!modelName || typeof modelName !== 'string') return DEFAULT_TEXT_MODEL;
  const trimmed = modelName.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'gemini-3.8-flash' || lower === 'gemini-3.5-flash') return 'gemini-2.5-flash';
  if (lower === 'gemini-3.5-flash-lite') return 'gemini-2.0-flash';
  if (lower === 'gemini-3.8-flash-tts' || lower === 'gemini-3.8-flash-lite-tts') return 'gemini-2.5-flash-preview-tts';
  if (lower === 'gemini-2.5-flash-image') return 'imagen-3.0-generate-002';
  if (lower === 'default') return 'gemini-2.5-flash';

  return trimmed;
};

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
      const extra = (agent.useCases && typeof agent.useCases === 'object') ? agent.useCases : {};
      cachedAgent = {
        id: agent.id,
        apiKey: sanitizeKey(agent.apiKey),
        model: (agent.model && agent.model !== 'default') ? agent.model.trim() : DEFAULT_TEXT_MODEL,
        provider: agent.provider || 'gemini',
        baseUrl: extra.baseUrl || '',
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
        if (linkedAgent && linkedAgent.apiKey) {
          const extra = (linkedAgent.useCases && typeof linkedAgent.useCases === 'object') ? linkedAgent.useCases : {};
          return {
            apiKey: sanitizeKey(linkedAgent.apiKey),
            model: normalizeModelName((linkedAgent.model && linkedAgent.model !== 'default') ? linkedAgent.model.trim() : DEFAULT_TEXT_MODEL),
            provider: linkedAgent.provider || 'gemini',
            baseUrl: extra.baseUrl || '',
            liveModel: aiConfig.liveModel || 'gemini-2.5-flash-native-audio-preview',
          };
        }
      }

      // If center has direct custom model or key
      if (aiConfig.model || aiConfig.apiKey) {
        const globalKey = await getApiKeyAsync();
        return {
          apiKey: sanitizeKey(aiConfig.apiKey) || globalKey,
          model: normalizeModelName(aiConfig.model || cachedAgent?.model || DEFAULT_TEXT_MODEL),
          provider: aiConfig.provider || 'gemini',
          baseUrl: aiConfig.baseUrl || '',
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
  const model = normalizeModelName(agent?.model || DEFAULT_TEXT_MODEL);
  return {
    apiKey,
    model,
    provider: agent?.provider || 'gemini',
    baseUrl: agent?.baseUrl || '',
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
      baseUrl: newAgent.baseUrl || '',
    };
    lastCheckTime = Date.now();
  } else if (typeof newAgent === 'string') {
    cachedAgent = {
      apiKey: sanitizeKey(newAgent),
      model: cachedAgent?.model || DEFAULT_TEXT_MODEL,
      provider: cachedAgent?.provider || 'gemini',
      baseUrl: '',
    };
    lastCheckTime = Date.now();
  } else {
    cachedAgent = null;
    loadKeyFromDb().catch(() => {});
  }
};

const STABLE_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

const isTransientAiError = (err) => {
  const msg = String(err?.message || err || '');
  const status = err?.status || err?.response?.status;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('Service Unavailable') ||
    msg.includes('high demand') ||
    msg.includes('ResourceExhausted') ||
    msg.includes('429') ||
    msg.includes('Too Many Requests') ||
    msg.includes('504') ||
    msg.includes('Gateway Timeout') ||
    msg.includes('overloaded')
  );
};

const isFallbackableError = (err) => {
  const msg = String(err?.message || err || '').toLowerCase();
  const status = err?.status || err?.response?.status;
  return (
    isTransientAiError(err) ||
    status === 404 ||
    msg.includes('not found') ||
    msg.includes('is not supported') ||
    msg.includes('unsupported') ||
    msg.includes('deprecated') ||
    msg.includes('invalid model')
  );
};

const createOpenAIModel = (apiKey, modelName, baseUrl, generationConfig) => {
  const effectiveBaseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const effectiveModel = modelName || 'gpt-4o';
  const isJsonMode = generationConfig?.responseMimeType === 'application/json';

  return {
    generateContent: async (promptArg) => {
      let promptText = '';
      if (typeof promptArg === 'string') {
        promptText = promptArg;
      } else if (Array.isArray(promptArg)) {
        promptText = promptArg.map(p => typeof p === 'string' ? p : p?.text || '').join('\n');
      } else if (promptArg?.text) {
        promptText = promptArg.text;
      }

      const payload = {
        model: effectiveModel,
        messages: [
          { role: 'user', content: promptText }
        ],
        ...(isJsonMode ? { response_format: { type: 'json_object' } } : {}),
      };

      const resp = await axios.post(`${effectiveBaseUrl}/chat/completions`, payload, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 90000,
      });

      const replyContent = resp.data?.choices?.[0]?.message?.content || '';
      return {
        response: {
          text: () => replyContent,
        },
      };
    },
  };
};

const createResilientModel = (client, primaryModelName, generationConfig) => {
  const normalizedPrimary = normalizeModelName(primaryModelName);
  const baseModel = client.getGenerativeModel({
    model: normalizedPrimary,
    generationConfig,
  });

  return new Proxy(baseModel, {
    get(target, prop, receiver) {
      if (prop === 'generateContent') {
        return async (...args) => {
          const candidateModels = [
            normalizedPrimary,
            ...STABLE_FALLBACK_MODELS.filter(m => m !== normalizedPrimary),
          ];

          let lastError = null;

          for (let i = 0; i < candidateModels.length; i++) {
            const currentModelName = candidateModels[i];
            const activeModelInstance = (currentModelName === normalizedPrimary)
              ? target
              : client.getGenerativeModel({ model: currentModelName, generationConfig });

            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                return await activeModelInstance.generateContent(...args);
              } catch (err) {
                lastError = err;
                if (!isFallbackableError(err)) {
                  throw err;
                }

                console.warn(`[Gemini Resilient] Attempt ${attempt} on model '${currentModelName}' failed: ${err.message}`);
                if (attempt < 2 && isTransientAiError(err)) {
                  await new Promise(r => setTimeout(r, 1000 * attempt));
                } else {
                  break;
                }
              }
            }

            console.warn(`[Gemini Resilient] Model '${currentModelName}' unavailable. Trying next fallback candidate...`);
          }

          throw lastError;
        };
      }

      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
};

/**
 * getModel supports both:
 * 1) getModel(true/false) — backward compatible
 * 2) getModel({ jsonMode, centerId, model, apiKey, provider, baseUrl }) — dynamic center-aware
 */
const getModel = (options = false) => {
  const jsonMode = typeof options === 'boolean' ? options : !!options?.jsonMode;
  const key = options?.apiKey || getCleanApiKey();
  const activeModel = options?.model || cachedAgent?.model || DEFAULT_TEXT_MODEL;
  const provider = options?.provider || cachedAgent?.provider || 'gemini';
  const baseUrl = options?.baseUrl || cachedAgent?.baseUrl || '';
  const generationConfig = jsonMode ? { responseMimeType: 'application/json' } : {};

  if (provider === 'openai' || (key && key.startsWith('sk-'))) {
    return createOpenAIModel(key, activeModel, baseUrl, generationConfig);
  }

  if (!key || key === 'unconfigured') {
    throw new Error("AI API kaliti sozlanmagan. Iltimos, Sozlamalar bo'limida AI Agent yoki API kalitni tekshiring.");
  }

  const normalizedModel = normalizeModelName(activeModel);
  const client = new GoogleGenerativeAI(key);
  return createResilientModel(client, normalizedModel, generationConfig);
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
  const provider = options?.provider || config.provider || 'gemini';
  const baseUrl = options?.baseUrl || config.baseUrl || '';
  const generationConfig = jsonMode ? { responseMimeType: 'application/json' } : {};

  if (!key || key === 'unconfigured') {
    throw new Error("AI API kaliti sozlanmagan. Iltimos, Sozlamalar bo'limida AI Agent yoki API kalitni tekshiring.");
  }

  if (provider === 'openai' || (key && key.startsWith('sk-'))) {
    return createOpenAIModel(key, activeModel, baseUrl, generationConfig);
  }

  const normalizedModel = normalizeModelName(activeModel);
  const client = new GoogleGenerativeAI(key);
  return createResilientModel(client, normalizedModel, generationConfig);
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
  normalizeModelName,
};
