const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GIMINI_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const getModel = (jsonMode = false) => {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: jsonMode ? { responseMimeType: 'application/json' } : {},
  });
};

module.exports = { genAI, getModel, apiKey };
