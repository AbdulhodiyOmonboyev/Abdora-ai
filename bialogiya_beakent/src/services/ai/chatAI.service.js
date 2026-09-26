const { getModel } = require('../../config/gemini');
const { getChatSystemPrompt } = require('./prompts');

const generateFallbackChatReply = (lesson, userMessage, language = 'uz') => {
  const title = lesson?.title || 'Dars';
  const rawContent = (lesson?.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const summary = lesson?.aiContent?.summary || rawContent.slice(0, 300) || `${title} mavzusidagi asosiy qoidalar va tushunchalar`;

  if (language === 'ru') {
    return `Здравствуйте! По теме "${title}" вы спросили: "${userMessage}". На основе материалов этого урока: ${summary}. Если у вас есть дополнительные вопросы по этой теме, напишите, и мы разберем их подробно!`;
  }
  if (language === 'en') {
    return `Hello! Regarding "${title}", your question was: "${userMessage}". Based on the lesson materials: ${summary}. Feel free to ask more specific questions about any part of this topic!`;
  }
  return `Assalomu alaykum! "${title}" mavzusi bo'yicha savolingiz: "${userMessage}". Ushbu dars materiallariga ko'ra: ${summary}. Ushbu mavzuning qaysi qismini yana chuqurroq ko'rib chiqishni istaysiz?`;
};

const chatWithAI = async (lesson, messages, userMessage, style = 'normal', language = 'uz', aiPreferences = {}) => {
  try {
    const aiContent = lesson?.aiContent || {};
    const systemPrompt = getChatSystemPrompt(lesson?.title || '', aiContent.summary || '', style, language, aiPreferences);

    const history = (messages || []).slice(-10);
    const historyText = history.map(m => `${m.role === 'user' ? 'Student' : 'Teacher AI'}: ${m.content}`).join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${historyText}\n\nStudent: ${userMessage}\nTeacher AI:`;

    const model = getModel(false);
    const result = await model.generateContent(fullPrompt);
    const text = result?.response?.text ? result.response.text().trim() : '';
    if (text) return text;
  } catch (err) {
    console.error('Gemini chat error, using pedagogical fallback:', err.message);
  }

  return generateFallbackChatReply(lesson, userMessage, language);
};

module.exports = { chatWithAI, generateFallbackChatReply };
