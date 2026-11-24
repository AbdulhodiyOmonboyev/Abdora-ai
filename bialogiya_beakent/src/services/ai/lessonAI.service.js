const { getModel, getModelAsync } = require('../../config/gemini');
const { prisma } = require('../../config/db');
const { LESSON_SYSTEM_PROMPT, getLessonGenerationPrompt } = require('./prompts');
const { sanitizeAiContent, safeJsonParse } = require('../../utils/sanitizeAiText');

/**
 * Duolingo uslubidagi standart interaktiv bosqichlarni yaratish (fallback / default structured steps)
 */
const buildDefaultDuolingoSteps = (title, content, parsed = {}, language = 'uz') => {
  const safeTitle = (title || 'Mavzu').trim();
  const cleanLang = ['uz', 'ru', 'en'].includes(language) ? language : 'uz';

  // 1. Concept step
  const conceptTitles = {
    uz: `Asosiy tushuncha: ${safeTitle}`,
    ru: `Ключевое понятие: ${safeTitle}`,
    en: `Core Concept: ${safeTitle}`,
  };
  const conceptExplanations = {
    uz: parsed?.simpleExplanation
      ? parsed.simpleExplanation.slice(0, 320)
      : (content && content.length > 20
          ? content.slice(0, 320)
          : `"${safeTitle}" mavzusi bo'yicha eng muhim tushuncha va amaliy qoidalarni o'rganamiz.`),
    ru: parsed?.simpleExplanation
      ? parsed.simpleExplanation.slice(0, 320)
      : (content && content.length > 20
          ? content.slice(0, 320)
          : `Изучаем ключевые понятия и важные правила темы "${safeTitle}".`),
    en: parsed?.simpleExplanation
      ? parsed.simpleExplanation.slice(0, 320)
      : (content && content.length > 20
          ? content.slice(0, 320)
          : `Let's explore the core concepts and fundamental rules of "${safeTitle}".`),
  };
  const conceptAnalogies = {
    uz: parsed?.mnemonics
      ? parsed.mnemonics.slice(0, 220)
      : `"${safeTitle}" xuddi soat mexanizmi kabi aniq tartib va qoidalar asosida ishlaydi.`,
    ru: parsed?.mnemonics
      ? parsed.mnemonics.slice(0, 220)
      : `Тема "${safeTitle}" работает слаженно, как точный часовой механизм.`,
    en: parsed?.mnemonics
      ? parsed.mnemonics.slice(0, 220)
      : `Think of "${safeTitle}" like an interconnected, harmonious mechanism.`,
  };
  const conceptSpeech = {
    uz: `Bugun biz "${safeTitle}" mavzusini qiziqarli bosqichma-bosqich o'rganamiz. Har bir savolga diqqat bilan javob bering!`,
    ru: `Сегодня мы изучаем тему "${safeTitle}". Внимательно слушайте и отвечайте на интерактивные вопросы!`,
    en: `Today we are exploring "${safeTitle}". Listen carefully and answer the interactive challenges!`,
  };

  const step1 = {
    step: 1,
    type: 'concept',
    title: conceptTitles[cleanLang],
    explanation: conceptExplanations[cleanLang],
    analogy: conceptAnalogies[cleanLang],
    speechText: conceptSpeech[cleanLang],
  };

  // 2. Match pairs step
  let pairs = [];
  if (Array.isArray(parsed?.flashcards) && parsed.flashcards.length >= 2) {
    pairs = parsed.flashcards
      .slice(0, 4)
      .map(fc => ({
        term: String(fc.front || fc.term || '').trim(),
        definition: String(fc.back || fc.definition || '').trim(),
      }))
      .filter(p => p.term && p.definition);
  }

  const fallbackPairsByLang = {
    uz: [
      { term: `${safeTitle} (Asos)`, definition: 'Darsning bosh mavzusi va maqsadi' },
      { term: 'Qoida', definition: 'Mavzuga oid muhim qonuniyat' },
      { term: 'Amaliyot', definition: "Bilimlarni hayotda qo'llash usuli" },
      { term: 'Xulosa', definition: "O'rganish natijasi va xulosasi" },
    ],
    ru: [
      { term: `${safeTitle} (Основа)`, definition: 'Главная тема и цель урока' },
      { term: 'Правило', definition: 'Закономерность процесса' },
      { term: 'Практика', definition: 'Применение знаний на практике' },
      { term: 'Итог', definition: 'Результат усвоения темы' },
    ],
    en: [
      { term: `${safeTitle} (Core)`, definition: 'The central topic and goal' },
      { term: 'Rule', definition: 'Fundamental law or principle' },
      { term: 'Application', definition: 'Using knowledge in practice' },
      { term: 'Summary', definition: 'Main takeaway and outcome' },
    ],
  };

  const fallbackList = fallbackPairsByLang[cleanLang];
  for (const fp of fallbackList) {
    if (pairs.length >= 4) break;
    if (!pairs.some(p => p.term.toLowerCase() === fp.term.toLowerCase())) {
      pairs.push(fp);
    }
  }

  const step2 = {
    step: 2,
    type: 'match_pairs',
    instruction: cleanLang === 'ru'
      ? 'Сопоставьте термины с их правильными определениями'
      : cleanLang === 'en'
      ? 'Match each term with its correct definition'
      : "Atamalarni ularning to'g'ri ta'riflari bilan juftlang",
    pairs: pairs.slice(0, 4),
  };

  // 3. Fill blank step
  const fillBlankData = {
    uz: {
      sentence: `"${safeTitle}" mavzusi fanda va ta'limda [___] o'rin egallaydi.`,
      correctWord: 'muhim',
      options: ['muhim', 'keraksiz', 'tasodifiy', 'zararsiz'],
      hint: "Darsning ahamiyatini ifodalovchi asosiy so'zni tanlang.",
    },
    ru: {
      sentence: `Тема "${safeTitle}" занимает [___] место в образовательной программе.`,
      correctWord: 'важное',
      options: ['важное', 'случайное', 'ненужное', 'опасное'],
      hint: 'Выберите слово, подчёркивающее ключевую ценность темы.',
    },
    en: {
      sentence: `The topic "${safeTitle}" plays an [___] role in the curriculum.`,
      correctWord: 'essential',
      options: ['essential', 'irrelevant', 'random', 'unrelated'],
      hint: 'Choose the word that highlights the primary significance.',
    },
  };
  const fb = fillBlankData[cleanLang];
  const step3 = {
    step: 3,
    type: 'fill_blank',
    sentence: fb.sentence,
    correctWord: fb.correctWord,
    options: fb.options,
    hint: fb.hint,
  };

  // 4. Multiple choice step
  let step4Question = null;
  if (Array.isArray(parsed?.quizQuestions) && parsed.quizQuestions[0]) {
    const q = parsed.quizQuestions[0];
    if (q.text && Array.isArray(q.options) && q.options.length >= 2) {
      step4Question = {
        question: q.text,
        options: q.options.slice(0, 4).map(o => ({
          text: o.text || String(o),
          isCorrect: Boolean(o.isCorrect),
          explanation: o.explanation || (o.isCorrect ? "To'g'ri javob!" : "Noto'g'ri variant."),
        })),
      };
    }
  }

  if (!step4Question) {
    const mcByLang = {
      uz: {
        question: `"${safeTitle}" mavzusining hayotdagi eng katta amaliy foydasi nima?`,
        options: [
          { text: "Qonuniyatlarni chuqur tushunish va amalda to'g'ri qo'llash", isCorrect: true, explanation: "To'g'ri! Mavzuning asl maqsadi fanni amaliyot bilan bog'lashdir." },
          { text: "Faqat formulalarni yodlab olish", isCorrect: false, explanation: "Faqat yodlash tushunishni ta'minlamaydi." },
          { text: "Atrofdagi jarayonlarga beparvo bo'lish", isCorrect: false, explanation: "Ilm insonni kuzatuvchan bo'lishga o'rgatadi." },
          { text: "Bilimlarni hech qachon ishlatmaslik", isCorrect: false, explanation: "Har bir dars amaliy hayot uchun foydali bo'lishi kerak." },
        ],
      },
      ru: {
        question: `В чем заключается практическая польза темы "${safeTitle}"?`,
        options: [
          { text: 'Глубокое понимание закономерностей и их практическое применение', isCorrect: true, explanation: 'Верно! Это главная цель изучения темы.' },
          { text: 'Исключительно механическое заучивание терминов', isCorrect: false, explanation: 'Заучивание без понимания не дает практического результата.' },
          { text: 'Игнорирование реальных природных процессов', isCorrect: false, explanation: 'Знания помогают понимать окружающий мир.' },
          { text: 'Бесполезность в повседневной жизни', isCorrect: false, explanation: 'Каждая научная тема имеет прикладное значение.' },
        ],
      },
      en: {
        question: `What is the key practical value of learning "${safeTitle}"?`,
        options: [
          { text: 'Deeply understanding principles and applying them in practice', isCorrect: true, explanation: 'Correct! That is the primary goal of this topic.' },
          { text: 'Pure rote memorization without comprehension', isCorrect: false, explanation: 'Memorization without understanding has little value.' },
          { text: 'Ignoring real-world phenomena', isCorrect: false, explanation: 'Science trains active observation.' },
          { text: 'Having no real-world application', isCorrect: false, explanation: 'Every core topic connects to practical life.' },
        ],
      },
    };
    step4Question = mcByLang[cleanLang];
  }

  const step4 = {
    step: 4,
    type: 'multiple_choice',
    question: step4Question.question,
    options: step4Question.options,
  };

  // 5. Word order step
  const wordOrderData = {
    uz: {
      instruction: "So'zlarni to'g'ri tartibda yig'ib, jumlani hosil qiling",
      targetSentence: `Biz ${safeTitle} mavzusini muvaffaqiyatli o'rganamiz`,
      words: ['Biz', safeTitle, 'mavzusini', 'muvaffaqiyatli', "o'rganamiz"],
      distractors: ["noto'g'ri", 'unutamiz'],
    },
    ru: {
      instruction: 'Составьте предложение, расположив слова в правильном порядке',
      targetSentence: `Мы успешно изучаем тему ${safeTitle}`,
      words: ['Мы', 'успешно', 'изучаем', 'тему', safeTitle],
      distractors: ['неправильно', 'забываем'],
    },
    en: {
      instruction: 'Arrange the words in the correct order to form the sentence',
      targetSentence: `We successfully master the topic of ${safeTitle}`,
      words: ['We', 'successfully', 'master', 'the', 'topic', 'of', safeTitle],
      distractors: ['wrongly', 'ignore'],
    },
  };
  const wo = wordOrderData[cleanLang];
  const step5 = {
    step: 5,
    type: 'word_order',
    instruction: wo.instruction,
    targetSentence: wo.targetSentence,
    words: wo.words,
    distractors: wo.distractors,
  };

  // 6. True / False step
  const trueFalseData = {
    uz: {
      statement: `"${safeTitle}" mavzusi kundalik hayotdagi real jarayonlar bilan uzviy bog'liq.`,
      isTrue: true,
      explanation: "To'g'ri, chunki har bir ilmiy mavzu atrofimizdagi hodisalarni tushuntirib beradi.",
    },
    ru: {
      statement: `Тема "${safeTitle}" тесно связана с реальными жизненными процессами.`,
      isTrue: true,
      explanation: 'Верно, так как наука объясняет явления окружающего мира.',
    },
    en: {
      statement: `The topic "${safeTitle}" is directly connected to real-world phenomena.`,
      isTrue: true,
      explanation: 'True, because science directly explains how the world functions.',
    },
  };
  const tf = trueFalseData[cleanLang];
  const step6 = {
    step: 6,
    type: 'true_false',
    statement: tf.statement,
    isTrue: tf.isTrue,
    explanation: tf.explanation,
  };

  // 7. Boss Challenge step
  const bossChallengeData = {
    uz: {
      title: `Yakuniy Boss Sinovi: ${safeTitle}`,
      scenario: `Siz barcha bosqichlarni muvaffaqiyatli tamomladingiz. Endi o'rganganlaringizni birlashtirib, ushbu murakkab topshiriqni bajaring!`,
      question: `"${safeTitle}" mavzusining asosiy tamoyilini eng to'g'ri ifodalovchi javobni tanlang:`,
      options: [
        { text: "Barcha elementlar o'zaro bog'liq va umumiy qonuniyatlar asosida ishlaydi", isCorrect: true },
        { text: "Hodisalar hech qanday sabab va qoidalarsiz yuz beradi", isCorrect: false },
        { text: "Mavzuni tushunishning amaliy ahamiyati mavjud emas", isCorrect: false },
        { text: "Hech qanday mantiqiy xulosaga kelib bo'lmaydi", isCorrect: false },
      ],
      explanation: "Ajoyib g'alaba! Siz mavzuning asl mohiyatini to'liq anglab yetdingiz va darsni 100% o'zlashtirdingiz!",
      xpReward: 50,
    },
    ru: {
      title: `Финальный Босс-раунд: ${safeTitle}`,
      scenario: `Вы успешно завершили все тренировочные этапы. Объедините полученные знания и решите главное испытание!`,
      question: `Какое утверждение наиболее полно выражает суть темы "${safeTitle}"?`,
      options: [
        { text: 'Все элементы взаимосвязаны и подчиняются общим научным закономерностям', isCorrect: true },
        { text: 'Процессы происходят случайно без всяких правил и причин', isCorrect: false },
        { text: 'Понимание этой темы не имеет практической ценности', isCorrect: false },
        { text: 'Сделать объективный вывод невозможно', isCorrect: false },
      ],
      explanation: 'Блестящая победа! Вы доказали полное владение темой и заслужили звание мастера!',
      xpReward: 50,
    },
    en: {
      title: `Final Boss Challenge: ${safeTitle}`,
      scenario: `You have successfully conquered all training modules. Combine your knowledge and win the final challenge!`,
      question: `Which statement best captures the core essence of "${safeTitle}"?`,
      options: [
        { text: 'All components are interconnected and follow consistent scientific laws', isCorrect: true },
        { text: 'Events happen randomly without underlying rules or causes', isCorrect: false },
        { text: 'Understanding this topic has no practical relevance', isCorrect: false },
        { text: 'It is impossible to draw any valid conclusion', isCorrect: false },
      ],
      explanation: 'Magnificent victory! You have mastered the subject and completed the challenge with excellence!',
      xpReward: 50,
    },
  };
  const bc = bossChallengeData[cleanLang];
  const step7 = {
    step: 7,
    type: 'boss_challenge',
    title: bc.title,
    scenario: bc.scenario,
    question: bc.question,
    options: bc.options,
    explanation: bc.explanation,
    xpReward: bc.xpReward,
  };

  return [step1, step2, step3, step4, step5, step6, step7];
};

/**
 * AI tomonidan qaytarilgan duolingoSteps ni tekshirish, tozalash va zarur bo'lsa to'ldirish
 */
const ensureDuolingoSteps = (rawSteps, title, content, parsed = {}, language = 'uz') => {
  const defaultSteps = buildDefaultDuolingoSteps(title, content, parsed, language);

  if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
    return defaultSteps;
  }

  const normalized = [];
  const knownTypes = new Set([
    'concept',
    'match_pairs',
    'fill_blank',
    'multiple_choice',
    'word_order',
    'true_false',
    'boss_challenge',
  ]);

  for (let i = 0; i < rawSteps.length; i++) {
    const s = rawSteps[i];
    if (!s || typeof s !== 'object') continue;

    const type = typeof s.type === 'string' ? s.type.trim().toLowerCase() : '';
    if (!type || !knownTypes.has(type)) {
      continue;
    }

    const stepObj = {
      step: normalized.length + 1,
      type,
    };

    if (type === 'concept') {
      stepObj.title = s.title || defaultSteps[0].title;
      stepObj.explanation = s.explanation || defaultSteps[0].explanation;
      stepObj.analogy = s.analogy || defaultSteps[0].analogy;
      stepObj.speechText = s.speechText || defaultSteps[0].speechText;
      normalized.push(stepObj);
    } else if (type === 'match_pairs') {
      stepObj.instruction = s.instruction || defaultSteps[1].instruction;
      let pairs = Array.isArray(s.pairs)
        ? s.pairs
            .map(p => ({
              term: String(p?.term || '').trim(),
              definition: String(p?.definition || '').trim(),
            }))
            .filter(p => p.term && p.definition)
        : [];
      if (pairs.length < 2) {
        pairs = defaultSteps[1].pairs;
      }
      stepObj.pairs = pairs.slice(0, 4);
      normalized.push(stepObj);
    } else if (type === 'fill_blank') {
      stepObj.sentence = s.sentence || defaultSteps[2].sentence;
      stepObj.correctWord = s.correctWord || defaultSteps[2].correctWord;
      let opts = Array.isArray(s.options) ? s.options.map(o => String(o).trim()).filter(Boolean) : [];
      if (opts.length < 2 || !opts.includes(stepObj.correctWord)) {
        opts = [stepObj.correctWord, ...(opts.filter(o => o !== stepObj.correctWord))];
        while (opts.length < 4) {
          const fallbackWord = defaultSteps[2].options[opts.length] || `variant${opts.length}`;
          if (!opts.includes(fallbackWord)) opts.push(fallbackWord);
          else opts.push(`${fallbackWord}_${opts.length}`);
        }
      }
      stepObj.options = opts.slice(0, 4);
      stepObj.hint = s.hint || defaultSteps[2].hint;
      normalized.push(stepObj);
    } else if (type === 'multiple_choice') {
      stepObj.question = s.question || defaultSteps[3].question;
      let opts = Array.isArray(s.options)
        ? s.options.map(o => ({
            text: typeof o === 'string' ? o : String(o?.text || ''),
            isCorrect: typeof o === 'object' ? Boolean(o.isCorrect) : false,
            explanation: typeof o === 'object' ? (o.explanation || '') : '',
          })).filter(o => o.text)
        : [];
      if (opts.length < 2 || !opts.some(o => o.isCorrect)) {
        opts = defaultSteps[3].options;
      }
      stepObj.options = opts.slice(0, 4);
      normalized.push(stepObj);
    } else if (type === 'word_order') {
      stepObj.instruction = s.instruction || defaultSteps[4].instruction;
      stepObj.targetSentence = s.targetSentence || defaultSteps[4].targetSentence;
      let words = Array.isArray(s.words) ? s.words.map(w => String(w).trim()).filter(Boolean) : [];
      if (words.length < 2 && stepObj.targetSentence) {
        words = stepObj.targetSentence.split(/\s+/).filter(Boolean);
      }
      stepObj.words = words.length > 0 ? words : defaultSteps[4].words;
      stepObj.distractors = Array.isArray(s.distractors)
        ? s.distractors.map(d => String(d).trim()).filter(Boolean)
        : defaultSteps[4].distractors;
      normalized.push(stepObj);
    } else if (type === 'true_false') {
      stepObj.statement = s.statement || defaultSteps[5].statement;
      stepObj.isTrue = s.isTrue !== undefined ? Boolean(s.isTrue) : defaultSteps[5].isTrue;
      stepObj.explanation = s.explanation || defaultSteps[5].explanation;
      normalized.push(stepObj);
    } else if (type === 'boss_challenge') {
      stepObj.title = s.title || defaultSteps[6].title;
      stepObj.scenario = s.scenario || defaultSteps[6].scenario;
      stepObj.question = s.question || defaultSteps[6].question;
      let opts = Array.isArray(s.options)
        ? s.options.map(o => ({
            text: typeof o === 'string' ? o : String(o?.text || ''),
            isCorrect: typeof o === 'object' ? Boolean(o.isCorrect) : false,
          })).filter(o => o.text)
        : [];
      if (opts.length < 2 || !opts.some(o => o.isCorrect)) {
        opts = defaultSteps[6].options;
      }
      stepObj.options = opts.slice(0, 4);
      stepObj.explanation = s.explanation || defaultSteps[6].explanation;
      stepObj.xpReward = Number(s.xpReward) || 50;
      normalized.push(stepObj);
    }
  }

  // Agar to'g'ri qadamlar 6 tadan kam bo'lsa, yetishmayotgan standart qadamlarni qo'shamiz
  if (normalized.length < 6) {
    const existingTypes = new Set(normalized.map(st => st.type));
    for (const defStep of defaultSteps) {
      if (!existingTypes.has(defStep.type)) {
        normalized.push(defStep);
        existingTypes.add(defStep.type);
      }
    }
  }

  // Qadam tartib raqamlarini yangilash
  return normalized.map((st, idx) => ({
    ...st,
    step: idx + 1,
  }));
};

const generateLessonAI = async (lessonId, title, content, language = 'uz') => {
  await prisma.lesson.update({ where: { id: lessonId }, data: { aiContent: { status: 'generating' } } });

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        centerId: true,
        groupId: true,
        group: { select: { centerId: true } },
      },
    });

    const centerId = lesson?.centerId || lesson?.group?.centerId || null;
    const model = await getModelAsync({ jsonMode: true, centerId });
    const resolvedContent = content || title || '';
    const prompt = `${LESSON_SYSTEM_PROMPT}\n\n${getLessonGenerationPrompt(title, resolvedContent, language)}`;
    const result = await model.generateContent(prompt);
    const text = result?.response?.text ? result.response.text() : String(result || '');
    const parsed = sanitizeAiContent(safeJsonParse(text, {})) || {};

    const duolingoSteps = ensureDuolingoSteps(parsed.duolingoSteps, title, resolvedContent, parsed, language);

    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        aiContent: {
          status: 'done',
          simpleExplanation: parsed.simpleExplanation || '',
          mnemonics: parsed.mnemonics || '',
          storyMode: parsed.storyMode || '',
          realLifeExamples: parsed.realLifeExamples || [],
          summary: parsed.summary || '',
          flashcards: parsed.flashcards || [],
          mindMapData: parsed.mindMapData || { nodes: [], edges: [] },
          quizQuestions: parsed.quizQuestions || [],
          tushunPedagogy: parsed.tushunPedagogy || null,
          duolingoSteps,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (err) {
    console.error('AI generation error:', err.message);
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        aiContent: {
          status: 'error',
          errorMessage: err.message || 'AI kontent yaratishda xatolik yuz berdi',
        },
      },
    });
  }
};

const generateQuiz = async (title, content, difficulty = 'medium', centerId = null) => {
  const prompt = `Generate 5 multiple-choice quiz questions about "${title}" based on: "${content.slice(0, 1000)}".
Difficulty: ${difficulty}.
Return valid JSON: {"questions":[{"text":"...","options":[{"text":"...","isCorrect":false},{"text":"...","isCorrect":true}],"explanation":"...","difficulty":"${difficulty}","points":1}]}
Each question must have exactly 4 options with exactly one isCorrect:true.`;

  try {
    const model = await getModelAsync({ jsonMode: true, centerId });
    const result = await model.generateContent(prompt);
    const rawText = result?.response?.text ? result.response.text() : String(result || '');
    const parsed = safeJsonParse(rawText, {}) || {};
    return parsed.questions || [];
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    return [];
  }
};

const generateTestFromPDFText = async (pdfText, groupId, teacherId, title, language = 'uz', centerId = null) => {
  const langNote = language === 'uz' ? "Iltimos, barcha savollarni O'zbek (uz) tilida yarating." : `Please generate the questions in ${language}.`;
  const prompt = `You are an expert teacher. Based on the following textbook content, create 15 multiple-choice test questions.
Language: ${language}.
${langNote}
Content:
${pdfText.slice(0, 3000)}

Return valid JSON:
{
  "title": "${title}",
  "summary": "A short student-facing summary of the PDF content (in the requested language)",
  "questions": [
    {
      "text": "question text",
      "options": [
        {"text": "option A", "isCorrect": false},
        {"text": "option B", "isCorrect": true},
        {"text": "option C", "isCorrect": false},
        {"text": "option D", "isCorrect": false}
      ],
      "explanation": "a concise reason the correct answer is right",
      "studentExplanation": "a step-by-step, beginner-friendly explanation for the student in the requested language",
      "difficulty": "medium",
      "points": 1
    }
  ]
}
Each question must have exactly 4 options with exactly one isCorrect:true. Provide studentExplanation for every question in the requested language.`;

  const model = await getModelAsync({ jsonMode: true, centerId });
  const result = await model.generateContent(prompt);
  const rawText = result?.response?.text ? result.response.text() : String(result || '');
  const parsed = safeJsonParse(rawText, null);
  return parsed;
};

module.exports = {
  generateLessonAI,
  generateQuiz,
  generateTestFromPDFText,
  safeJsonParse,
  buildDefaultDuolingoSteps,
  ensureDuolingoSteps,
};
