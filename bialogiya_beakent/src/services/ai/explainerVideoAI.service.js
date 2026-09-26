const { getModel } = require('../../config/gemini');
const { getExplainerVideoPrompt } = require('./prompts');
const { sanitizeAiContent } = require('../../utils/sanitizeAiText');

const generateFallbackExplainerScript = (title, content, language = 'uz') => {
  const cleanTitle = (title || "Dars mavzusi").trim();
  const rawText = (content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = rawText.split(/[.?!]+/).map(s => s.trim()).filter(s => s.length > 10);

  const chunk1 = sentences.slice(0, 3).join('. ') || `${cleanTitle} bo'yicha kirish ma'lumotlari bilan tanishamiz.`;
  const chunk2 = sentences.slice(3, 7).join('. ') || `${cleanTitle} mavzusidagi eng muhim tushunchalar va asosiy qoidalar.`;
  const chunk3 = sentences.slice(7, 11).join('. ') || `${cleanTitle} bilimlarini amalda qanday qo'llash va asosiy xususiyatlar.`;
  const chunk4 = sentences.slice(11, 15).join('. ') || `${cleanTitle} bo'yicha o'rganilgan materiallarni mustahkamlash va xulosalar.`;

  return {
    topic: cleanTitle,
    language,
    slides: [
      {
        index: 0,
        title: `${cleanTitle}: Kirish`,
        bullets: [
          "Mavzuning asosiy maqsadi bilan tanishish",
          `Nima uchun ${cleanTitle} muhim tushuncha hisoblanadi`,
          "Dars davomida o'rganiladigan asosiy yo'nalishlar",
        ],
        narration: `Assalomu alaykum! Bugungi darsimiz mavzusi: ${cleanTitle}. ${chunk1}.`,
        imagePrompt: `Educational illustration introducing ${cleanTitle}, clean infographic style, colorful flat vector.`,
      },
      {
        index: 1,
        title: "Asosiy tushunchalar",
        bullets: [
          "Mavzuga oid muhim terminlar va ta'riflar",
          "Asosiy qoidalar va tamoyillar",
          "E'tibor berish lozim bo'lgan nuqtalar",
        ],
        narration: `Mavzuning asosiy mazmuniga to'xtaladigan bo'lsak: ${chunk2}. Bu qoidalar sizga mavzuni chuqur tushunishga yordam beradi.`,
        imagePrompt: `Educational diagram explaining core concepts of ${cleanTitle}, schematic vector, modern design.`,
      },
      {
        index: 2,
        title: "Amaliy qo'llanishi va misollar",
        bullets: [
          "Nazariyani amaliyotda qo'llash usullari",
          "Mavzuga oid tipik misollar tahlili",
          "Xatolardan qochish bo'yicha tavsiyalar",
        ],
        narration: `Endi amaliy jihatlarga qaraylik: ${chunk3}. Ushbu misollarni tahlil qilish orqali bilimlaringiz mustahkamlanadi.`,
        imagePrompt: `Practical real-world application of ${cleanTitle}, educational modern illustration, clean minimal vector.`,
      },
      {
        index: 3,
        title: "Xulosa va takrorlash",
        bullets: [
          "Dars davomida o'rganilgan asosiy xulosalar",
          "O'z-o'zini tekshirish uchun muhim savollar",
          "Keyingi bosqichlarga tayyorgarlik",
        ],
        narration: `Xulosa qilib aytganda, bugun biz ${cleanTitle} mavzusini ko'rib chiqdik. ${chunk4}. Bilimlaringizni test va topshiriqlar orqali mustahkamlang!`,
        imagePrompt: `Summary and achievement icon for ${cleanTitle}, clean victory and learning theme, flat vector.`,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
};

const generateExplainerScript = async (title, content, language = 'uz') => {
  try {
    const model = getModel(true);
    const prompt = getExplainerVideoPrompt(title, content, language);
    const result = await model.generateContent(prompt);
    const text = result?.response?.text ? result.response.text() : '';
    if (text) {
      const parsed = sanitizeAiContent(JSON.parse(text));
      const slides = Array.isArray(parsed?.slides) ? parsed.slides.slice(0, 8) : [];
      if (slides.length > 0) {
        return {
          topic: parsed.topic || title,
          language,
          slides: slides.map((s, i) => ({
            index: i,
            title: s.title || `Slayd ${i + 1}`,
            bullets: Array.isArray(s.bullets) ? s.bullets.slice(0, 5) : [],
            narration: s.narration || '',
            imagePrompt: s.imagePrompt || `Simple flat-design educational illustration of: ${s.title || title}. No text, no letters, no numbers in the image.`,
          })),
          generatedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Explainer AI generation error, using fallback structured slides:', err.message);
  }

  // Graceful fallback: always returns valid educational slides
  return generateFallbackExplainerScript(title, content, language);
};

module.exports = { generateExplainerScript, generateFallbackExplainerScript };
