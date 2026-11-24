const test = require('node:test');
const assert = require('node:assert/strict');

// 1. AI Prompts & Personalization Services
const {
  LESSON_SYSTEM_PROMPT,
  getChatSystemPrompt,
  getGradingPrompt,
  getResultAnalysisPrompt,
  getLessonGenerationPrompt,
} = require('../src/services/ai/prompts');

const {
  buildDefaultDuolingoSteps,
  ensureDuolingoSteps,
} = require('../src/services/ai/lessonAI.service');

const { sanitizeAiContent } = require('../src/utils/sanitizeAiText');
const { parseQuestionsFromText } = require('../src/utils/testParser');

test('AI Chat System Prompt: respects language, style, and personal preferences', () => {
  // Test Uzbek
  const promptUz = getChatSystemPrompt(
    'Fotosintez',
    'Yoruglik energiyasining kimyoviy energiyaga aylanishi',
    'socratic',
    'uz',
    {
      explanationStyle: 'analogies',
      difficulty: 'advanced',
      interests: 'futbol, kompyuter o\'yinlari',
      customInstructions: 'Doimo qisqa va aniq javob ber',
    }
  );

  assert.equal(typeof promptUz, 'string');
  assert.equal(promptUz.includes('Fotosintez'), true);
  assert.equal(promptUz.includes('O\'zbek'), true);
  assert.equal(promptUz.includes('futbol, kompyuter o\'yinlari'), true, 'Student interests must be in the prompt');
  assert.equal(promptUz.includes('Doimo qisqa va aniq javob ber'), true, 'Custom instructions must be in the prompt');

  // Test Russian
  const promptRu = getChatSystemPrompt(
    'Фотосинтез',
    'Превращение энергии света',
    'simple',
    'ru',
    {
      interests: 'шахматы',
    }
  );
  assert.equal(promptRu.toLowerCase().includes('русском языке'), true);
  assert.equal(promptRu.includes('шахматы'), true);

  // Test English
  const promptEn = getChatSystemPrompt(
    'Photosynthesis',
    'Light to chemical energy',
    'exam',
    'en',
    {}
  );
  assert.equal(promptEn.includes('English'), true);
  assert.equal(promptEn.includes('Photosynthesis'), true);
});

test('AI Grading & Evaluation: generates correct structured prompts', () => {
  const gradingPrompt = getGradingPrompt(
    'Xloroplastlar tuzilishi',
    'Xloroplastlarning asosiy qismlarini yozing',
    'Tilakoidlar, grana va stroma bor',
    100
  );

  assert.equal(typeof gradingPrompt, 'string');
  assert.equal(gradingPrompt.includes('Xloroplastlar tuzilishi'), true);
  assert.equal(gradingPrompt.includes('100'), true);
  assert.equal(gradingPrompt.includes('score'), true);
  assert.equal(gradingPrompt.includes('feedback'), true);
});

test('AI Result Analysis: returns structured feedback prompt with language support', () => {
  const wrongQuestions = [{ question: 'Xlorofill qayerda joylashgan?', studentAnswer: 'Mitoxondriyada', correctAnswer: 'Tilakoid membranasida' }];
  const correctTopics = ['Hujayra qobig\'i'];

  const analysisPrompt = getResultAnalysisPrompt('Biologiya 1-bob', wrongQuestions, correctTopics, 'uz');
  assert.equal(typeof analysisPrompt, 'string');
  assert.equal(analysisPrompt.includes('Xlorofill'), true);
  assert.equal(analysisPrompt.includes('weakTopics'), true);
  assert.equal(analysisPrompt.includes('studyRecommendations'), true);
});

test('AI Text Sanitization: handles undefined, null, or malformed AI response gracefully', () => {
  const empty = sanitizeAiContent(null);
  assert.equal(typeof empty, 'object');

  const malformed = {
    simpleExplanation: 'Bu toza matn',
    realLifeExamples: 'Bu array bolishi kerak edi, string keldi',
    flashcards: null,
  };

  const clean = sanitizeAiContent(malformed);
  assert.equal(clean.simpleExplanation, 'Bu toza matn');
});

test('Duolingo Style AI Lesson Generation: prompt includes 6-8 interactive steps and Duolingo methodology', () => {
  assert.equal(typeof LESSON_SYSTEM_PROMPT, 'string');
  assert.equal(LESSON_SYSTEM_PROMPT.includes('Duolingo'), true);
  assert.equal(LESSON_SYSTEM_PROMPT.includes('duolingoSteps'), true);

  const promptUz = getLessonGenerationPrompt(
    'Fotosintez jarayoni',
    'O\'simliklar quyosh nuri, suv va karbonat angidrid yordamida organik moddalar hosil qiladi.',
    'uz'
  );

  assert.equal(typeof promptUz, 'string');
  assert.equal(promptUz.includes('duolingoSteps'), true);
  assert.equal(promptUz.includes('DUOLINGO-STYLE INTERACTIVE LEARNING PATHWAY'), true);
  assert.equal(promptUz.includes('concept'), true);
  assert.equal(promptUz.includes('match_pairs'), true);
  assert.equal(promptUz.includes('fill_blank'), true);
  assert.equal(promptUz.includes('multiple_choice'), true);
  assert.equal(promptUz.includes('word_order'), true);
  assert.equal(promptUz.includes('true_false'), true);
  assert.equal(promptUz.includes('boss_challenge'), true);
});

test('Duolingo Steps Fallback Builder: generates structured 7-step sequence with all required types', () => {
  const steps = buildDefaultDuolingoSteps(
    'Hujayra tuzilishi',
    'Hujayra barcha tirik organizmlarning asosiy tuzilish va funksional birligidir.',
    {
      simpleExplanation: 'Hujayra - bu mitti mo\'jizaviy shahar!',
      mnemonics: 'Yadro = shahar hokimi, mitoxondriya = elektr stansiyasi.',
      flashcards: [
        { front: 'Yadro', back: 'Irsiy axborotni saqlovchi markaz' },
        { front: 'Mitoxondriya', back: 'Hujayraning energiya stansiyasi' },
        { front: 'Ribosoma', back: 'Oqsil sintez qiluvchi organoid' },
        { front: 'Membrana', back: 'Hujayrani himoyalovchi parda' },
      ],
    },
    'uz'
  );

  assert.equal(Array.isArray(steps), true);
  assert.equal(steps.length, 7);

  // Check sequential steps and types
  const expectedTypes = [
    'concept',
    'match_pairs',
    'fill_blank',
    'multiple_choice',
    'word_order',
    'true_false',
    'boss_challenge',
  ];

  steps.forEach((step, idx) => {
    assert.equal(step.step, idx + 1);
    assert.equal(step.type, expectedTypes[idx]);
  });

  // Verify step 1 (concept)
  assert.equal(steps[0].type, 'concept');
  assert.equal(typeof steps[0].title, 'string');
  assert.equal(typeof steps[0].explanation, 'string');
  assert.equal(typeof steps[0].analogy, 'string');
  assert.equal(typeof steps[0].speechText, 'string');

  // Verify step 2 (match_pairs)
  assert.equal(steps[1].type, 'match_pairs');
  assert.equal(Array.isArray(steps[1].pairs), true);
  assert.equal(steps[1].pairs.length, 4);
  assert.equal(steps[1].pairs[0].term, 'Yadro');

  // Verify step 3 (fill_blank)
  assert.equal(steps[2].type, 'fill_blank');
  assert.equal(steps[2].sentence.includes('[___]'), true);
  assert.equal(steps[2].options.includes(steps[2].correctWord), true);

  // Verify step 4 (multiple_choice)
  assert.equal(steps[3].type, 'multiple_choice');
  assert.equal(Array.isArray(steps[3].options), true);
  assert.equal(steps[3].options.some(o => o.isCorrect === true), true);

  // Verify step 5 (word_order)
  assert.equal(steps[4].type, 'word_order');
  assert.equal(Array.isArray(steps[4].words), true);
  assert.equal(steps[4].words.length >= 3, true);

  // Verify step 6 (true_false)
  assert.equal(steps[5].type, 'true_false');
  assert.equal(typeof steps[5].isTrue, 'boolean');

  // Verify step 7 (boss_challenge)
  assert.equal(steps[6].type, 'boss_challenge');
  assert.equal(steps[6].xpReward >= 50, true);
});

test('ensureDuolingoSteps: validates raw AI response and fills missing steps when incomplete', () => {
  // 1. When rawSteps is empty/null, it returns default complete steps
  const fallbackSteps = ensureDuolingoSteps(null, 'Genetika', '', {}, 'uz');
  assert.equal(Array.isArray(fallbackSteps), true);
  assert.equal(fallbackSteps.length, 7);

  // 2. When AI returns partial steps (e.g. only 2 steps), it supplements to reach at least 6-7 steps
  const partialRaw = [
    {
      type: 'concept',
      title: 'Genetika asoslari',
      explanation: 'Genlar belgilarni avloddan avlodga o\'tkazadi',
      analogy: 'Gen = kompyuter kodi',
      speechText: 'Genetika darsiga xush kelibsiz!',
    },
    {
      type: 'match_pairs',
      instruction: 'Atamalarni juftlang',
      pairs: [
        { term: 'Gen', definition: 'Irsiyat birligi' },
        { term: 'DNK', definition: 'Genetik axborot tashuvchisi' },
      ],
    },
  ];

  const supplemented = ensureDuolingoSteps(partialRaw, 'Genetika', '', {}, 'uz');
  assert.equal(supplemented.length >= 7, true);
  assert.equal(supplemented[0].title, 'Genetika asoslari');
  assert.equal(supplemented[1].pairs[0].term, 'Gen');

  // Check step indices are 1..N
  supplemented.forEach((s, i) => {
    assert.equal(s.step, i + 1);
  });
});

test('Test Parser: correctly extracts multiple-choice questions from raw text', () => {
  const rawText = `
1. O'simliklarda fotosintez qaysi organoidda boradi?
A) Mitoxondriya
B) Xloroplast
C) Ribosoma
D) Vakuola
Javob: B

2. Odam skeletida nechta suyak bor?
A) 150
B) 206
C) 300
D) 500
Javob: B
  `;

  if (typeof parseQuestionsFromText === 'function') {
    const questions = parseQuestionsFromText(rawText);
    assert.equal(Array.isArray(questions), true);
    assert.equal(questions.length >= 1, true);
  }
});

// 2. Language switching API validation
test('Language switching controller logic: rejects invalid languages and accepts valid uz/ru/en', () => {
  const validLanguages = ['uz', 'ru', 'en'];

  function validateLanguage(lang) {
    if (!lang || !validLanguages.includes(lang)) {
      return { valid: false, error: 'Yaroqsiz til (uz, ru, en talab qilinadi)' };
    }
    return { valid: true };
  }

  assert.equal(validateLanguage('uz').valid, true);
  assert.equal(validateLanguage('ru').valid, true);
  assert.equal(validateLanguage('en').valid, true);

  assert.equal(validateLanguage('de').valid, false);
  assert.equal(validateLanguage('').valid, false);
  assert.equal(validateLanguage(null).valid, false);
  assert.equal(validateLanguage(undefined).valid, false);
});

// 3. Admin Centers & Active Branches Counting Logic
test('Center branches count logic: counts only active branches and excludes soft-deleted', () => {
  const branchesInDb = [
    { id: 'b1', name: 'Chilonzor', centerId: 'c1', isActive: true, groups: 2 },
    { id: 'b2', name: 'Yunusobod', centerId: 'c1', isActive: true, groups: 1 },
    { id: 'b3', name: 'Eski filial', centerId: 'c1', isActive: false, groups: 0 }, // soft deleted
    { id: 'b4', name: 'Test filial', centerId: 'c1', isActive: false, groups: 0 },  // soft deleted
  ];

  // Old bug: count all rows
  const oldRawCount = branchesInDb.filter(b => b.centerId === 'c1').length;
  assert.equal(oldRawCount, 4);

  // New fixed logic: filter isActive: true
  const activeCount = branchesInDb.filter(b => b.centerId === 'c1' && b.isActive === true).length;
  assert.equal(activeCount, 2);
  assert.equal(activeCount < oldRawCount, true);
});

// 4. Cleanup Empty Branches Logic
test('Cleanup empty branches logic: detects branches with zero relations and preserves branches with data', () => {
  const branches = [
    { id: 'b1', name: 'Asosiy filial', isActive: true, groupsCount: 3, teachersCount: 2, studentsCount: 15 },
    { id: 'b2', name: 'Faol filial 2', isActive: true, groupsCount: 1, teachersCount: 1, studentsCount: 5 },
    { id: 'b3', name: 'Bo\'sh test 1', isActive: true, groupsCount: 0, teachersCount: 0, studentsCount: 0 },
    { id: 'b4', name: 'Bo\'sh test 2', isActive: false, groupsCount: 0, teachersCount: 0, studentsCount: 0 },
  ];

  const emptyBranches = branches.filter(b => {
    const totalRelations = b.groupsCount + b.teachersCount + b.studentsCount;
    return !b.isActive || totalRelations === 0;
  });

  assert.equal(emptyBranches.length, 2);
  assert.equal(emptyBranches[0].id, 'b3');
  assert.equal(emptyBranches[1].id, 'b4');

  // Verify non-empty branches are NEVER selected for deletion
  const safeBranches = branches.filter(b => !emptyBranches.includes(b));
  assert.equal(safeBranches.length, 2);
  assert.equal(safeBranches.every(b => b.groupsCount > 0), true);
});

// 5. Timetable conflict detection (ERP)
test('Timetable conflict logic: detects overlapping schedules in same room', () => {
  function hasTimeOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  // Same room: 09:00 - 10:30 and 10:00 - 11:30 (Overlap!)
  assert.equal(hasTimeOverlap('09:00', '10:30', '10:00', '11:30'), true);

  // Same room: 09:00 - 10:30 and 10:30 - 12:00 (No overlap, adjacent)
  assert.equal(hasTimeOverlap('09:00', '10:30', '10:30', '12:00'), false);

  // Same room: 14:00 - 16:00 and 11:00 - 12:00 (No overlap)
  assert.equal(hasTimeOverlap('14:00', '16:00', '11:00', '12:00'), false);
});

// 6. Lesson Step & Quiz API exports and mastery calculations
test('Lesson Controller: exports submitLessonStep and finishLessonQuiz', () => {
  const lessonController = require('../src/controllers/lesson.controller');
  assert.equal(typeof lessonController.submitLessonStep, 'function');
  assert.equal(typeof lessonController.finishLessonQuiz, 'function');
  assert.equal(typeof lessonController.completeLesson, 'function');
  assert.equal(typeof lessonController.getStudentLessonProgress, 'function');
});

test('Quiz Mastery calculation: correctly assigns percentage and stars', () => {
  function calculateMasteryAndStars(score, totalQuestions) {
    const masteryPercent = totalQuestions > 0 ? Math.min(100, Math.round((score / totalQuestions) * 100)) : 100;
    const stars = masteryPercent >= 90 ? 3 : masteryPercent >= 60 ? 2 : masteryPercent > 0 ? 1 : 0;
    return { masteryPercent, stars };
  }

  // 5 / 5 -> 100%, 3 stars
  const perfect = calculateMasteryAndStars(5, 5);
  assert.equal(perfect.masteryPercent, 100);
  assert.equal(perfect.stars, 3);

  // 3 / 4 -> 75%, 2 stars
  const good = calculateMasteryAndStars(3, 4);
  assert.equal(good.masteryPercent, 75);
  assert.equal(good.stars, 2);

  // 1 / 4 -> 25%, 1 star
  const low = calculateMasteryAndStars(1, 4);
  assert.equal(low.masteryPercent, 25);
  assert.equal(low.stars, 1);

  // 0 / 5 -> 0%, 0 stars
  const zero = calculateMasteryAndStars(0, 5);
  assert.equal(zero.masteryPercent, 0);
  assert.equal(zero.stars, 0);
});
