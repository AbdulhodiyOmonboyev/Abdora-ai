const { GoogleGenAI } = require('@google/genai');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { getCleanApiKey, getApiKeyAsync, resolveAiConfig } = require('../config/gemini');
const { getSpeakingCoachInstructions } = require('../services/ai/prompts');

// Gemini Live model fallback
const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview';

// POST /api/speaking/session
const createSpeakingSession = async (req, res, next) => {
  try {
    const centerId = req.user?.centerId || null;
    const aiConfig = await resolveAiConfig(centerId);
    const apiKey = aiConfig?.apiKey || (await getApiKeyAsync()) || getCleanApiKey();
    const activeLiveModel = aiConfig?.liveModel || LIVE_MODEL;

    if (!apiKey) {
      return error(res, 'AI API kaliti serverda sozlanmagan', 400);
    }

    const { topic, lessonId, level } = req.body || {};

    let resolvedTopic = topic || '';
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
      if (lesson) resolvedTopic = lesson.title;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { language: true } });
    const instructions = getSpeakingCoachInstructions(resolvedTopic, user?.language || 'uz', level || 'intermediate');

    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    let token = null;

    try {
      const genAI = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: 'v1alpha' }, // required for ephemeral tokens
      });

      const authToken = await genAI.authTokens.create({
        config: {
          uses: 1,
          expireTime,
          liveConnectConstraints: {
            model: activeLiveModel,
            config: {
              responseModalities: ['AUDIO'],
              systemInstruction: instructions,
            },
          },
        },
      });
      token = authToken?.name;
    } catch (tokenErr) {
      // Google AI Studio API keys (AIzaSy...) do not support AuthTokenService.CreateToken
      // (which requires OAuth2 / Vertex AI credentials).
      // Fallback: pass the cleaned API key directly so WebSocket connection connects via ?key=
      console.warn('Gemini Live ephemeral token unavailable, using API key session:', tokenErr.message);
      token = apiKey;
    }

    return success(res, {
      token,
      model: activeLiveModel,
      topic: resolvedTopic,
      expireTime,
      instructions,                        // always returned so client can put it in setup
      isApiKey: token === apiKey,          // true = API Studio key; false = ephemeral token
    });
  } catch (err) {
    console.error('Gemini Live session error:', err.message);
    return error(res, 'Speaking sessiyasini boshlashda xatolik yuz berdi: ' + err.message, 500);
  }
};

module.exports = { createSpeakingSession };
