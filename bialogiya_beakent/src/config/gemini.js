const { GoogleGenerativeAI } = require('@google/generative-ai');

const getCleanApiKey = () => {
  const key = process.env.GIMINI_AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';
  return key ? key.trim().replace(/^["']|["']$/g, '') : '';
};

const apiKey = getCleanApiKey();
const genAI = new GoogleGenerativeAI(apiKey || 'unconfigured');

const getModel = (jsonMode = false) => {
  const key = getCleanApiKey();
  const client = (key && key !== apiKey) ? new GoogleGenerativeAI(key) : genAI;
  return client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
  });
};

module.exports = { genAI, getModel, apiKey, getCleanApiKey };
