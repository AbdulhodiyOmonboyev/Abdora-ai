const { GoogleGenAI } = require('@google/genai');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { getCleanApiKey, getApiKeyAsync } = require('../config/gemini');
const { getSpeakingCoachInstructions } = require('../services/ai/prompts');

// Gemini Live model names are preview/rotating - override via env if Google
// renames/retires this one. See https://ai.google.dev/gemini-api/docs/models
const LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview-09-2025';

// POST /api/speaking/session
// Creates a Gemini Live session for real-time bidirectional audio.
// If ephemeral token creation succeeds (Vertex AI/OAuth), it uses the minted token.
// If ephemeral token is unsupported by the API key (AI Studio keys), it safely falls
// back to the cleaned API key so the client WebSocket can connect without 502 error.
const createSpeakingSession = async (req, res, next) => {
  try {
    const apiKey = (await getApiKeyAsync()) || getCleanApiKey();
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
            model: LIVE_MODEL,
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
      model: LIVE_MODEL,
      topic: resolvedTopic,
      expireTime,
    });
  } catch (err) {
    console.error('Gemini Live session error:', err.message);
    return error(res, 'Speaking sessiyasini boshlashda xatolik yuz berdi: ' + err.message, 500);
  }
};

module.exports = { createSpeakingSession };
