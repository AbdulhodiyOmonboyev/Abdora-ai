const { prisma } = require('../config/db');
const { getModelAsync } = require('../config/gemini');
const { synthesizeSpeech, MIME_TYPE: TTS_MIME_TYPE } = require('../services/ai/geminiTts.service');
const { success, error } = require('../utils/apiResponse');

const stripMarkdown = (text = '') =>
  String(text)
    .replace(/[*_`#>~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const stripHtml = (html = '') =>
  String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const parseAchievementsObj = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (Array.isArray(raw)) return { badges: raw };
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : { badges: Array.isArray(parsed) ? parsed : [] };
    } catch {
      return {};
    }
  }
  return {};
};

const extractCompletedLessonIds = (achievementsRaw) => {
  const ach = parseAchievementsObj(achievementsRaw);
  const ids = new Set();

  if (Array.isArray(ach.completedLessons)) {
    ach.completedLessons.forEach((item) => {
      const id = typeof item === 'object' && item?.id ? item.id : item;
      if (typeof id === 'string' && id.trim()) ids.add(id.trim());
    });
  }

  if (Array.isArray(ach.masteredLessons)) {
    ach.masteredLessons.forEach((id) => {
      if (typeof id === 'string' && id.trim()) ids.add(id.trim());
    });
  }

  if (ach.lessonMastery && typeof ach.lessonMastery === 'object') {
    Object.entries(ach.lessonMastery).forEach(([lessonId, data]) => {
      if (data?.isMastered || Number(data?.mastery) >= 70) {
        ids.add(lessonId);
      }
    });
  }

  if (ach.lessonProgress && typeof ach.lessonProgress === 'object') {
    Object.entries(ach.lessonProgress).forEach(([lessonId, data]) => {
      if (data?.isMastered || Number(data?.masteryPercent) >= 70) {
        ids.add(lessonId);
      }
    });
  }

  return Array.from(ids);
};

const extractLessonSummaryAndFacts = (lesson) => {
  const plainContent = stripHtml(lesson?.content || '');
  const ai = lesson?.aiContent && typeof lesson.aiContent === 'object' ? lesson.aiContent : {};
  const summaryText = stripMarkdown(ai.summary || ai.explanation || '');
  const combined = [summaryText, plainContent].filter(Boolean).join(' ').slice(0, 2400);

  const questions = [];

  // 1. Quiz questions inside aiContent
  const rawQuizzes = Array.isArray(ai.quiz)
    ? ai.quiz
    : Array.isArray(ai.questions)
    ? ai.questions
    : [];
  rawQuizzes.forEach((q) => {
    const qText = stripMarkdown(q?.question || q?.prompt || '');
    let expected = '';
    if (typeof q?.correctAnswer === 'string') {
      expected = q.correctAnswer;
    } else if (typeof q?.correctIndex === 'number' && Array.isArray(q?.options)) {
      expected = q.options[q.correctIndex] || '';
    } else if (typeof q?.answer === 'string') {
      expected = q.answer;
    }
    if (qText && expected) {
      questions.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        question: qText,
        expectedAnswer: stripMarkdown(expected),
        explanation: stripMarkdown(q?.explanation || ''),
      });
    }
  });

  // 2. Duolingo steps inside aiContent.steps
  if (Array.isArray(ai.steps)) {
    ai.steps.forEach((step) => {
      const qText = stripMarkdown(step?.question || step?.prompt || '');
      let expected = '';
      if (typeof step?.correctAnswer === 'string') expected = step.correctAnswer;
      else if (typeof step?.answer === 'string') expected = step.answer;
      else if (typeof step?.correctIndex === 'number' && Array.isArray(step?.options)) {
        expected = step.options[step.correctIndex] || '';
      }
      if (qText && expected) {
        questions.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          question: qText,
          expectedAnswer: stripMarkdown(expected),
          explanation: stripMarkdown(step?.explanation || step?.content || ''),
        });
      }
    });
  }

  // 3. Flashcards inside aiContent.flashcards
  if (Array.isArray(ai.flashcards)) {
    ai.flashcards.forEach((card) => {
      const front = stripMarkdown(card?.front || card?.term || '');
      const back = stripMarkdown(card?.back || card?.definition || '');
      if (front && back) {
        questions.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          question: `«${lesson.title}» darsidan savol: ${front} nima?`,
          expectedAnswer: back,
          explanation: back,
        });
      }
    });
  }

  // 4. Fallback questions synthesized directly from lesson content sentences
  if (questions.length === 0) {
    const sentences = combined
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 25 && s.length <= 220);

    if (sentences.length > 0) {
      questions.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        question: `Biz birga o'tgan «${lesson.title}» darsini eslaymizmi? Shu mavzudagi eng muhim tushuncha yoki qoidani o'z so'zingiz bilan aytib bera olasizmi?`,
        expectedAnswer: sentences.slice(0, 2).join(' '),
        explanation: sentences.slice(0, 2).join(' '),
      });
    } else {
      questions.push({
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        question: `«${lesson.title}» darsidan nimalarni bilib oldingiz? Qisqacha gapirib bering!`,
        expectedAnswer: `${lesson.title} mavzusidagi asosiy tushunchalar`,
        explanation: `«${lesson.title}» darsi bo'yicha asosiy bilimlarni mustahkamlash.`,
      });
    }
  }

  return {
    id: lesson.id,
    title: lesson.title,
    subject: lesson.subject || '',
    order: lesson.order || 0,
    knowledgeText: combined || `${lesson.title} (${lesson.subject || 'Dars'})`,
    questions,
  };
};

const loadStudentLessonScope = async (userId, fallbackCenterId = null) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      xp: true,
      level: true,
      centerId: true,
      groupId: true,
      permissions: true,
      achievements: true,
      center: { select: { settings: true } },
      branch: { select: { center: { select: { settings: true } } } },
      group: { select: { id: true, name: true, subject: true } },
    },
  });

  if (!user) return null;

  const centerSettings = user.center?.settings || user.branch?.center?.settings || {};
  const avatarDisabled =
    centerSettings?.features?.avatarEnabled === false ||
    centerSettings?.roles?.student?.permissions?.canUseAvatar === false;

  const completedIds = extractCompletedLessonIds(user.achievements);
  const completedIdSet = new Set(completedIds);
  const centerId = user.centerId || fallbackCenterId || null;

  let where = { isActive: true };
  if (user.groupId) {
    where.groupId = user.groupId;
  } else if (centerId) {
    where = { isActive: true, centerId, groupId: null };
  } else {
    where = { isActive: true, id: { in: completedIds.length > 0 ? completedIds : ['__none__'] } };
  }

  let curriculumLessons = await prisma.lesson.findMany({
    where,
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      subject: true,
      order: true,
      content: true,
      aiContent: true,
    },
  });

  // Also ensure any completedLessonIds that belonged to center general lessons are loaded
  const missingCompletedIds = completedIds.filter((cid) => !curriculumLessons.some((l) => l.id === cid));
  if (missingCompletedIds.length > 0) {
    const extraCompleted = await prisma.lesson.findMany({
      where: {
        id: { in: missingCompletedIds },
        isActive: true,
        ...(centerId ? { OR: [{ centerId }, { centerId: null }] } : {}),
      },
      select: {
        id: true,
        title: true,
        subject: true,
        order: true,
        content: true,
        aiContent: true,
      },
    });
    curriculumLessons = [...curriculumLessons, ...extraCompleted];
  }

  const completedLessons = curriculumLessons
    .filter((l) => completedIdSet.has(l.id))
    .map(extractLessonSummaryAndFacts);

  const uncompletedLessons = curriculumLessons
    .filter((l) => !completedIdSet.has(l.id))
    .map((l) => ({
      id: l.id,
      title: l.title,
      subject: l.subject || '',
      order: l.order || 0,
    }));

  return {
    user,
    avatarDisabled,
    completedLessons,
    uncompletedLessons,
    totalCurriculumCount: curriculumLessons.length,
  };
};

const tokenizeUzbek = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ffʻʼ'`\s-]/gi, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);

const mentionsUncompletedTopic = (message, completedLessons, uncompletedLessons) => {
  if (!uncompletedLessons.length) return null;
  const msgLower = String(message || '').toLowerCase();
  const completedWords = new Set(
    completedLessons.flatMap((l) => tokenizeUzbek(l.title))
  );

  for (const ul of uncompletedLessons) {
    const titleLower = String(ul.title || '').toLowerCase().trim();
    if (titleLower.length >= 4 && msgLower.includes(titleLower)) {
      return ul;
    }
    const ulTokens = tokenizeUzbek(ul.title).filter((t) => t.length >= 5 && !completedWords.has(t));
    if (ulTokens.length > 0 && ulTokens.some((tok) => msgLower.includes(tok))) {
      return ul;
    }
  }
  return null;
};

const evaluateAnswerDeterministically = (studentAnswer, activeQuiz) => {
  const cleanAns = String(studentAnswer || '').trim().toLowerCase();
  const expected = String(activeQuiz?.expectedAnswer || '').trim();
  const expectedLower = expected.toLowerCase();

  if (/bilmayman|eslolmadim|aytib ber|tushuntir|yordam/i.test(cleanAns)) {
    return {
      isCorrect: false,
      gaveUp: true,
      feedback: `Hechqisi yo'q! «${activeQuiz.lessonTitle}» darsimizga ko'ra to'g'ri javob: ${expected}. Endi eslab qoldingizmi? Xohlasangiz siz menga savol bering yoki yana savol so'rang!`,
    };
  }

  if (expectedLower && (cleanAns.includes(expectedLower) || expectedLower.includes(cleanAns)) && cleanAns.length >= 2) {
    return {
      isCorrect: true,
      gaveUp: false,
      feedback: `Barakalla, to'ppa-to'g'ri javob berdingiz! «${activeQuiz.lessonTitle}» darsini juda yaxshi o'zlashtiribsiz: ${expected}. Endi navbat sizga — menga savol bering yoki yana savol berishimni tanlang!`,
    };
  }

  const expectedTokens = tokenizeUzbek(expected);
  const ansTokens = new Set(tokenizeUzbek(cleanAns));
  const matched = expectedTokens.filter((t) => ansTokens.has(t));
  const ratio = expectedTokens.length > 0 ? matched.length / expectedTokens.length : 0;

  // Also check sentence-level match when expectedAnswer spans multiple sentences
  const expectedSentences = expected
    .split(/(?<=[.!?])\s+/)
    .map((s) => tokenizeUzbek(s))
    .filter((toks) => toks.length >= 2);
  const sentenceHit = expectedSentences.some((sToks) => {
    const sMatched = sToks.filter((t) => ansTokens.has(t));
    return sMatched.length / sToks.length >= 0.5;
  });

  if (ratio >= 0.38 || sentenceHit || (matched.length >= 3 && cleanAns.length >= 8)) {
    return {
      isCorrect: true,
      gaveUp: false,
      feedback: `Barakalla! Javobingiz to'g'ri! «${activeQuiz.lessonTitle}» darsidagi asosiy ma'lumot: ${expected}. Endi siz menga savol berasizmi yoki yana bitta savol beraymi?`,
    };
  }

  return {
    isCorrect: false,
    gaveUp: false,
    feedback: `Yaxshi urinish! Aslida «${activeQuiz.lessonTitle}» darsimizda shunday deyilgan: ${expected}. Keling, davom etamiz — endi siz menga shu darsdan savol bering yoki yana savol so'rang!`,
  };
};

const buildScopedDeterministicReply = ({
  avatarName,
  avatarProfession,
  message,
  user,
  completedLessons,
  uncompletedLessons,
}) => {
  const q = String(message || '').toLowerCase();
  const studentName = user?.name ? user.name.split(' ')[0] : "do'stim";
  const xp = typeof user?.xp === 'number' ? user.xp : 0;
  const completedTitles = completedLessons.map((l) => `«${l.title}»`).join(', ');

  if (/^(salom|assalom|qalay|yaxshimisiz|yahshimisan)/i.test(q.trim())) {
    if (completedLessons.length === 0) {
      const firstNext = uncompletedLessons[0]?.title ? `«${uncompletedLessons[0].title}»` : 'birinchi';
      return `Salom, ${studentName}! Men ${avatarName} (${avatarProfession}). Men faqat siz o'tgan darslarni bilaman. Hozircha hali dars tugatmagansiz — «Darslar» bo'limidan ${firstNext} darsni o'qib tugating, keyin savol-javob qilamiz!`;
    }
    return `Salom, ${studentName}! Men ${avatarName} (${avatarProfession}). Biz hozirgacha ${completedLessons.length} ta darsni (${completedTitles}) o'tdik. Shu mavzulardan menga savol bering yoki «Menga savol ber» tugmasini bosing!`;
  }

  if (/isming|kimsan|kasb/i.test(q)) {
    return `Mening ismim ${avatarName}, kasbim ${avatarProfession}. Men faqat siz o'zlashtirgan darslarni (${completedLessons.length} ta dars) bilaman va siz bilan o'sha mavzularda savol-javob qilaman!`;
  }

  if (/xp|ball|daraja|level/i.test(q)) {
    return `${studentName}, hozir sizda ${xp} XP bor va ${completedLessons.length} ta darsni tugatgansiz! Yangi darslarni o'zlashtirsangiz, mening bilimim ham kengayib boradi.`;
  }

  if (completedLessons.length === 0) {
    const nextHint = uncompletedLessons[0]?.title
      ? `Avval «${uncompletedLessons[0].title}» darsini o'qib yakunlang`
      : `Avval «Darslar» bo'limidan darsni tugating`;
    return `${studentName}, men faqat siz o'tgan darslarni bilaman! Hozircha 0 ta dars tugatilgan. ${nextHint}, shundan so'ng bir-birimiz bilan savol-javob qilamiz!`;
  }

  const uncompletedHit = mentionsUncompletedTopic(message, completedLessons, uncompletedLessons);
  if (uncompletedHit) {
    return `${studentName}, biz hali «${uncompletedHit.title}» darsini o'tmadik! Men faqat siz tugatgan darslarni (${completedTitles}) bilaman. Keling, o'tilgan darslarimizdan savol-javob qilamiz!`;
  }

  // Search completedLessons for matching content sentences
  const queryTokens = tokenizeUzbek(message).filter((t) => !['nima', 'qanday', 'haqida', 'aytib', 'bering', 'dars', 'uchun', 'bilan'].includes(t));
  let bestLesson = null;
  let bestSentence = '';
  let bestScore = 0;

  for (const lesson of completedLessons) {
    const sentences = lesson.knowledgeText.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      const sLower = s.toLowerCase();
      let score = 0;
      queryTokens.forEach((tok) => {
        if (sLower.includes(tok)) score += 2;
        if (lesson.title.toLowerCase().includes(tok)) score += 1;
      });
      if (score > bestScore) {
        bestScore = score;
        bestLesson = lesson;
        bestSentence = s.trim();
      }
    }
  }

  if (bestLesson && bestScore >= 2 && bestSentence) {
    const followUp = bestLesson.questions[0]?.question || `Shu «${bestLesson.title}» darsidan yana nimani eslaysiz?`;
    return `«${bestLesson.title}» darsimizga ko'ra: ${bestSentence} Endi mening savolim: ${followUp}`;
  }

  return `${studentName}, bu savol hozircha siz tugatgan darslar (${completedTitles}) ichida uchramadi — men faqat siz o'tgan darslarni bilaman! Keling, ${completedTitles} bo'yicha savol-javob qilamiz!`;
};

// GET /api/ai/avatar-context
const getAvatarContext = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return error(res, "3D AI Avatar faqat o'quvchilar uchun mavjud", 403);
    }

    const scope = await loadStudentLessonScope(req.user.userId, req.user.centerId);
    if (!scope) return error(res, 'Foydalanuvchi topilmadi', 404);
    if (scope.avatarDisabled) {
      return error(res, "Ushbu o'quv markazda 3D AI Avatar funksiyasi o'chirilgan", 403);
    }

    return success(res, {
      completedCount: scope.completedLessons.length,
      totalCount: scope.totalCurriculumCount,
      completedLessons: scope.completedLessons.map((l) => ({
        id: l.id,
        title: l.title,
        subject: l.subject,
        order: l.order,
      })),
      nextLesson: scope.uncompletedLessons[0] || null,
    });
  } catch (err) {
    console.error('getAvatarContext error:', err.message);
    return error(res, "Avatar ma'lumotlarini yuklashda xatolik", 500);
  }
};

// POST /api/ai/avatar-chat
const avatarChat = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return error(res, "3D AI Avatar faqat o'quvchilar uchun mavjud", 403);
    }

    const {
      message = '',
      mode = 'chat', // 'chat' | 'ask_student' | 'check_answer'
      lessonId = null,
      activeQuiz = null,
      history = [],
      avatarName,
      avatarProfession,
    } = req.body || {};

    if (mode !== 'ask_student' && (!message || typeof message !== 'string' || !message.trim())) {
      return error(res, 'Xabar matni kiritilishi shart', 400);
    }

    const scope = await loadStudentLessonScope(req.user.userId, req.user.centerId);
    if (!scope) return error(res, 'Foydalanuvchi topilmadi', 404);
    if (scope.avatarDisabled) {
      return error(res, "Ushbu o'quv markazda 3D AI Avatar funksiyasi o'chirilgan", 403);
    }

    const { user, completedLessons, uncompletedLessons } = scope;
    const savedProfile = user?.permissions?.avatarProfile || {};
    const resolvedAvatarName =
      (typeof avatarName === 'string' && avatarName.trim()) ||
      savedProfile.name ||
      'Abdora';
    const resolvedAvatarProfession =
      (typeof avatarProfession === 'string' && avatarProfession.trim()) ||
      savedProfile.profession ||
      "O'quv do'sti";

    const studentFirstName = user?.name ? user.name.split(' ')[0] : "do'stim";

    // ── MODE 1: AVATAR ASKS STUDENT A QUESTION FROM COMPLETED LESSONS ──
    if (mode === 'ask_student') {
      if (completedLessons.length === 0) {
        const nextTitle = uncompletedLessons[0]?.title ? `«${uncompletedLessons[0].title}»` : 'birinchi';
        return success(res, {
          reply: `${studentFirstName}, biz hali birorta darsni tugatmadik! Men faqat siz o'tgan darslarni bilaman. Avval «Darslar» bo'limiga kirib ${nextTitle} darsni o'qib yakunlang, shundan keyin men siz bilan savol-javob qilaman!`,
          avatarName: resolvedAvatarName,
          avatarProfession: resolvedAvatarProfession,
          completedCount: 0,
          activeQuiz: null,
        });
      }

      const targetLesson =
        (lessonId && completedLessons.find((l) => l.id === lessonId)) ||
        completedLessons[Math.floor(Math.random() * completedLessons.length)];

      const recentQuestionsText = Array.isArray(history)
        ? history.slice(-6).map((h) => h?.content || '').join(' ')
        : '';

      const availablePool = targetLesson.questions.filter(
        (qItem) => !recentQuestionsText.includes(qItem.question.slice(0, 25))
      );
      const fallbackQuiz =
        (availablePool.length > 0
          ? availablePool[Math.floor(Math.random() * availablePool.length)]
          : targetLesson.questions[Math.floor(Math.random() * targetLesson.questions.length)]);

      try {
        const model = await getModelAsync({ jsonMode: true, centerId: req.user.centerId });
        const quizPrompt = [
          `Sen o'quvchining 3D AI do'stisan. Isming: ${resolvedAvatarName}, kasbing: ${resolvedAvatarProfession}.`,
          `O'quvchi ismi: ${studentFirstName}.`,
          `FAQAT quyidagi o'tilgan dars matni asosida o'quvchiga BITTA qisqa, qiziqarli o'zbekcha savol tuz:`,
          `Dars nomi: «${targetLesson.title}»`,
          `Dars matni: ${targetLesson.knowledgeText}`,
          recentQuestionsText ? `Avval berilgan savollar (bularni takrorlama): ${recentQuestionsText}` : '',
          `Javobni FAQAT JSON formatda qaytar: {"question": "o'quvchiga samimiy ohangda beriladigan savol (dars nomini ham eslatib o't)", "expectedAnswer": "dars matnidagi qisqa to'g'ri javob"}`,
        ]
          .filter(Boolean)
          .join('\n');

        const result = await model.generateContent(quizPrompt);
        const rawJson = result?.response?.text?.() || '';
        const match = rawJson.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) : null;

        if (parsed?.question && parsed?.expectedAnswer) {
          const cleanQ = stripMarkdown(parsed.question);
          return success(res, {
            reply: cleanQ,
            avatarName: resolvedAvatarName,
            avatarProfession: resolvedAvatarProfession,
            completedCount: completedLessons.length,
            activeQuiz: {
              lessonId: targetLesson.id,
              lessonTitle: targetLesson.title,
              question: cleanQ,
              expectedAnswer: stripMarkdown(parsed.expectedAnswer),
            },
          });
        }
      } catch (quizErr) {
        console.warn('Avatar ask_student Gemini fallback:', quizErr.message);
      }

      return success(res, {
        reply: fallbackQuiz.question,
        avatarName: resolvedAvatarName,
        avatarProfession: resolvedAvatarProfession,
        completedCount: completedLessons.length,
        activeQuiz: {
          lessonId: targetLesson.id,
          lessonTitle: targetLesson.title,
          question: fallbackQuiz.question,
          expectedAnswer: fallbackQuiz.expectedAnswer,
        },
      });
    }

    // ── MODE 2: CHECK STUDENT'S ANSWER TO AVATAR'S QUESTION ──
    if ((mode === 'check_answer' || activeQuiz?.question) && activeQuiz?.lessonTitle) {
      const quizLesson = completedLessons.find((l) => l.id === activeQuiz.lessonId) || completedLessons[0];
      const deterministicEval = evaluateAnswerDeterministically(message, activeQuiz);

      try {
        if (quizLesson) {
          const model = await getModelAsync({ jsonMode: true, centerId: req.user.centerId });
          const evalPrompt = [
            `Sen o'quvchining 3D AI do'stisan (${resolvedAvatarName}, ${resolvedAvatarProfession}).`,
            `O'tilgan dars: «${activeQuiz.lessonTitle}». Dars matni: ${quizLesson.knowledgeText}`,
            `Sening bergan savoling: "${activeQuiz.question}"`,
            `Kutilgan javob: "${activeQuiz.expectedAnswer}"`,
            `O'quvchining javobi: "${message.trim()}"`,
            `O'quvchi javobini FAQAT shu dars asosida tekshir va samimiy o'zbek tilida 1-3 gapda bahola (to'g'ri bo'lsa maqta, xato yoki 'bilmayman' bo'lsa to'g'ri javobni tushuntir va endi u ham senga savol berishi mumkinligini ayt).`,
            `FAQAT JSON qaytar: {"isCorrect": true/false, "reply": "..."}`,
          ].join('\n');

          const result = await model.generateContent(evalPrompt);
          const rawJson = result?.response?.text?.() || '';
          const match = rawJson.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : null;
          if (parsed?.reply) {
            return success(res, {
              reply: stripMarkdown(parsed.reply),
              isCorrect: Boolean(parsed.isCorrect),
              avatarName: resolvedAvatarName,
              avatarProfession: resolvedAvatarProfession,
              completedCount: completedLessons.length,
              activeQuiz: null,
            });
          }
        }
      } catch (evalErr) {
        console.warn('Avatar check_answer Gemini fallback:', evalErr.message);
      }

      return success(res, {
        reply: deterministicEval.feedback,
        isCorrect: deterministicEval.isCorrect,
        avatarName: resolvedAvatarName,
        avatarProfession: resolvedAvatarProfession,
        completedCount: completedLessons.length,
        activeQuiz: null,
      });
    }

    // ── MODE 3: STUDENT ASKS AVATAR A QUESTION (STRICTLY COMPLETED LESSONS ONLY!) ──
    if (completedLessons.length === 0) {
      const reply = buildScopedDeterministicReply({
        avatarName: resolvedAvatarName,
        avatarProfession: resolvedAvatarProfession,
        message,
        user,
        completedLessons,
        uncompletedLessons,
      });
      return success(res, {
        reply,
        avatarName: resolvedAvatarName,
        avatarProfession: resolvedAvatarProfession,
        completedCount: 0,
        activeQuiz: null,
      });
    }

    const uncompletedHit = mentionsUncompletedTopic(message, completedLessons, uncompletedLessons);
    if (uncompletedHit) {
      const completedTitles = completedLessons.map((l) => `«${l.title}»`).join(', ');
      return success(res, {
        reply: `${studentFirstName}, biz hali «${uncompletedHit.title}» darsini o'tmadik! Men faqat siz tugatgan darslarni (${completedTitles}) bilaman. Avval o'sha darsni tugating yoki keling, o'tilgan darslarimizdan savol-javob qilamiz!`,
        avatarName: resolvedAvatarName,
        avatarProfession: resolvedAvatarProfession,
        completedCount: completedLessons.length,
        activeQuiz: null,
      });
    }

    const completedKnowledgeBlock = completedLessons
      .map((l, i) => `[${i + 1}-o'tilgan dars: «${l.title}»]\n${l.knowledgeText}`)
      .join('\n\n');

    const forbiddenTitles = uncompletedLessons.map((l) => `«${l.title}»`).join(', ');

    const recentHistory = Array.isArray(history)
      ? history
          .slice(-6)
          .map((item) => {
            const role = item?.role === 'assistant' || item?.role === 'model' ? resolvedAvatarName : studentFirstName;
            const text = typeof item?.content === 'string' ? item.content : (item?.text || '');
            return text.trim() ? `${role}: ${text.trim()}` : null;
          })
          .filter(Boolean)
          .join('\n')
      : '';

    const prompt = [
      `Sen Abdora ta'lim platformasidagi o'quvchining shaxsiy 3D AI avatar do'stisan.`,
      `Sening isming: ${resolvedAvatarName}. Kasbing: ${resolvedAvatarProfession}. O'quvchi ismi: ${studentFirstName}.`,
      `ENG QAT'IY QOIDALAR:`,
      `1. Sen FAQAT quyidagi «O'QUVCHI O'TGAN DARSLAR» bo'limidagi bilimlarni bilasan!`,
      `2. Agar o'quvchi hali o'tmagan dars yoki ushbu ro'yxatda yo'q har qanday ilmiy mavzu haqida so'rasa, ASLO javobini aytib berma! «Biz hali bu mavzuni o'tmadik, men faqat siz o'tgan darslarni bilaman» deb samimiy ayt va o'tilgan darslardan savol-javob qilishni taklif et.`,
      forbiddenTitles ? `3. Hali O'TILMAGAN (taqiqlangan) darslar ro'yxati: ${forbiddenTitles}.` : '',
      `4. Agar savol o'tilgan darsga oid bo'lsa, o'sha dars matni asosida tabiiy o'zbek tilida 1-3 ta qisqa gapda javob ber va javobing oxirida o'quvchiga ham o'sha o'tilgan darsdan bitta qisqa savol berib o'zaro savol-javobni davom ettir!`,
      `5. Markdown belgilarini (*, **, #, -) ishlatma, faqat jonli suhbat matni yoz.`,
      `\n=== O'QUVCHI O'TGAN DARSLAR (${completedLessons.length} ta) ===\n${completedKnowledgeBlock}\n===================================`,
      recentHistory ? `\nOldingi suhbat:\n${recentHistory}` : '',
      `\nO'quvchi xabari: ${message.trim()}`,
      `${resolvedAvatarName}:`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const model = await getModelAsync({ jsonMode: false, centerId: req.user.centerId });
      const result = await model.generateContent(prompt);
      const rawReply = result?.response?.text?.() || '';
      const reply = stripMarkdown(rawReply);

      if (reply) {
        return success(res, {
          reply,
          avatarName: resolvedAvatarName,
          avatarProfession: resolvedAvatarProfession,
          completedCount: completedLessons.length,
          activeQuiz: null,
        });
      }
    } catch (aiErr) {
      console.warn('Avatar chat Gemini fallback:', aiErr.message);
    }

    return success(res, {
      reply: buildScopedDeterministicReply({
        avatarName: resolvedAvatarName,
        avatarProfession: resolvedAvatarProfession,
        message,
        user,
        completedLessons,
        uncompletedLessons,
      }),
      avatarName: resolvedAvatarName,
      avatarProfession: resolvedAvatarProfession,
      completedCount: completedLessons.length,
      activeQuiz: null,
    });
  } catch (err) {
    console.error('avatarChat error:', err.message);
    return error(res, 'Avatar suhbatida xatolik yuz berdi', 500);
  }
};

const avatarTts = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return error(res, "3D AI Avatar faqat o'quvchilar uchun mavjud", 403);
    }
    const scope = await loadStudentLessonScope(req.user.userId, req.user.centerId);
    if (scope?.avatarDisabled) {
      return error(res, "Ushbu o'quv markazda 3D AI Avatar funksiyasi o'chirilgan", 403);
    }

    const { text, gender } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return error(res, 'Matn kiritilishi shart', 400);
    }

    const voice = gender === 'boy' ? 'Puck' : 'Kore';
    const audioBuffer = await synthesizeSpeech(text.trim(), {
      voice,
      centerId: req.user.centerId,
    });

    res.set({
      'Content-Type': TTS_MIME_TYPE || 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-store',
    });
    return res.send(audioBuffer);
  } catch (err) {
    console.warn('avatarTts fallback to client Web Speech:', err.message);
    return res.status(204).end();
  }
};

module.exports = {
  getAvatarContext,
  avatarChat,
  avatarTts,
  // Exported for unit tests
  loadStudentLessonScope,
  buildScopedDeterministicReply,
  evaluateAnswerDeterministically,
};
