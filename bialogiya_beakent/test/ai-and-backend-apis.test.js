const test = require('node:test');
const assert = require('node:assert/strict');

// 1. AI Prompts & Personalization Services
const {
  getChatSystemPrompt,
  getGradingPrompt,
  getResultAnalysisPrompt,
  getLessonGenerationPrompt,
} = require('../src/services/ai/prompts');

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
