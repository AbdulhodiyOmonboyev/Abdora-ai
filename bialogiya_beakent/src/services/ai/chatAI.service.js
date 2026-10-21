const { getModel, getModelAsync } = require('../../config/gemini');
const { getChatSystemPrompt } = require('./prompts');

const generateFallbackChatReply = (lesson, userMessage, language = 'uz') => {
  const title = lesson?.title || 'Dars';
  const rawContent = (lesson?.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const summary = lesson?.aiContent?.summary || rawContent.slice(0, 300) || `${title} mavzusidagi asosiy tushunchalar`;

  if (language === 'ru') {
    return `Привет, мой друг! По теме "${title}" ты спросил: "${userMessage}". Главное, что нужно знать: ${summary}. Не переживай, если что-то кажется сложным — мы разберем всё шаг за шагом! О чем еще хочешь спросить?`;
  }
  if (language === 'en') {
    return `Hey there, my friend! Regarding "${title}", you asked: "${userMessage}". Here is the core idea: ${summary}. Don't worry if any part feels confusing, we can explore it step by step together! What would you like to dive into?`;
  }
  return `Salom, do'stim! "${title}" mavzusi bo'yicha bergan savoling juda o'rinli: "${userMessage}". Bu mavzuning asosiy g'oyasi: ${summary}. Qaysi qismi seni ko'proq qiziqtiryapti yoki biroz tushunarsiz tuyulyapti? Bemalol ayt, birgalikda ko'rib chiqamiz!`;
};

const chatWithAI = async (lesson, messages, userMessage, style = 'tushun_friend', language = 'uz', aiPreferences = {}) => {
  try {
    const aiContent = lesson?.aiContent || {};
    const systemPrompt = getChatSystemPrompt(lesson?.title || '', aiContent.summary || '', style, language, aiPreferences);

    const history = (messages || []).slice(-10);
    const historyText = history.map(m => `${m.role === 'user' ? "O'quvchi (Do'stim)" : "Abdora Do'st"}: ${m.content}`).join('\n');

    const fullPrompt = `${systemPrompt}\n\nSuhbat tarixi:\n${historyText}\n\nO'quvchi (Do'stim): ${userMessage}\nAbdora Do'st:`;

    const model = await getModelAsync({ jsonMode: false, centerId: lesson?.centerId });
    const result = await model.generateContent(fullPrompt);
    const text = result?.response?.text ? result.response.text().trim() : '';
    if (text) return text;
  } catch (err) {
    console.error('Gemini chat error, using pedagogical fallback:', err.message);
  }

  return generateFallbackChatReply(lesson, userMessage, language);
};

module.exports = { chatWithAI, generateFallbackChatReply };
