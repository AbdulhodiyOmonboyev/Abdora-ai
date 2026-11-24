const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getInteractiveHomeworkAnalysisPrompt,
  getGenerateAnswersPrompt,
  getValidateAnswersPrompt,
  getInteractiveGradingPrompt,
} = require('../src/services/ai/prompts');

const {
  calculateDeterministicGrade,
  gradeInteractiveHomework,
} = require('../src/services/ai/gradingAI.service');

const {
  analyzeInteractiveHomework,
  generateAnswers,
  validateAnswers,
  createHomework,
  submitHomework,
  getHomeworkById,
} = require('../src/controllers/homework.controller');

test('Prompt: getInteractiveHomeworkAnalysisPrompt generates correct schema and prompts', () => {
  const prompt = getInteractiveHomeworkAnalysisPrompt({
    topic: 'Ingliz tili: Present Continuous',
    content: 'Darslik matni: bolalar bog\'chada o\'ynamoqda...',
    category: 'reading',
    language: 'uz',
  });

  assert.equal(typeof prompt, 'string');
  assert.equal(prompt.includes('Present Continuous'), true);
  assert.equal(prompt.includes('reading'), true);
  assert.equal(prompt.includes('interactiveFields'), true);
  assert.equal(prompt.includes('fill_blank'), true);
  assert.equal(prompt.includes('short_answer'), true);
  assert.equal(prompt.includes('voice_record'), true);
  assert.equal(prompt.includes('generatedAnswerKey'), true);
  assert.equal(prompt.includes('suggestedRubric'), true);
});

test('Prompt: getGenerateAnswersPrompt includes interactive fields and instructions', () => {
  const fields = [
    { id: 'f1', type: 'fill_blank', question: 'She ___ (read) a book right now.' },
    { id: 'f2', type: 'multiple_choice', question: 'Choose the correct form', options: ['is', 'are', 'am'] },
  ];
  const prompt = getGenerateAnswersPrompt({
    title: 'Present Continuous Mashqlari',
    description: 'Bo\'shliqlarni to\'ldiring',
    category: 'writing',
    interactiveFields: fields,
    language: 'uz',
  });

  assert.equal(typeof prompt, 'string');
  assert.equal(prompt.includes('Present Continuous Mashqlari'), true);
  assert.equal(prompt.includes('f1'), true);
  assert.equal(prompt.includes('answerKey'), true);
});

test('Prompt: getValidateAnswersPrompt includes teacher key and checks for ambiguity', () => {
  const prompt = getValidateAnswersPrompt({
    title: 'Biologiya: Fotosintez',
    description: 'Savollarga javob bering',
    category: 'reading',
    readingPassage: 'Yashil o\'simliklar quyosh nuri ta\'sirida...',
    interactiveFields: [{ id: 'f1', question: 'Xloroplast nima?' }],
    answerKey: { f1: 'Osimlik pigmenti' },
    language: 'uz',
  });

  assert.equal(typeof prompt, 'string');
  assert.equal(prompt.includes('Biologiya: Fotosintez'), true);
  assert.equal(prompt.includes('Osimlik pigmenti'), true);
  assert.equal(prompt.includes('issues'), true);
  assert.equal(prompt.includes('suggestions'), true);
});

test('Prompt: getInteractiveGradingPrompt generates comprehensive grading schema', () => {
  const prompt = getInteractiveGradingPrompt({
    homeworkTitle: 'English Speaking Practice',
    description: 'Read the text and record your voice',
    category: 'speaking',
    readingPassage: 'Technology is transforming education.',
    interactiveFields: [
      { id: 'q1', type: 'short_answer', question: 'What is the main idea?', points: 30 },
      { id: 'q2', type: 'voice_record', question: 'Record your summary', points: 70 },
    ],
    answerKey: { q1: 'Technology shapes learning' },
    studentAnswers: { q1: 'Technology transforms school' },
    audioTranscript: 'Technology is transforming education and school.',
    maxScore: 100,
    language: 'uz',
  });

  assert.equal(typeof prompt, 'string');
  assert.equal(prompt.includes('English Speaking Practice'), true);
  assert.equal(prompt.includes('speaking'), true);
  assert.equal(prompt.includes('Technology transforms school'), true);
  assert.equal(prompt.includes('fieldGrades'), true);
  assert.equal(prompt.includes('rubricScores'), true);
});

test('Grading: calculateDeterministicGrade gives full points for exact matches and partial for near matches', () => {
  const interactiveFields = [
    { id: 'f1', type: 'fill_blank', expectedAnswer: 'photosynthesis', points: 40 },
    { id: 'f2', type: 'multiple_choice', expectedAnswer: 'chloroplast', points: 30 },
    { id: 'f3', type: 'voice_record', points: 30 },
  ];
  const answerKey = { f1: 'photosynthesis', f2: 'chloroplast' };

  // Case 1: Student gets f1 exact, f2 wrong, f3 recorded
  const grade1 = calculateDeterministicGrade({
    interactiveFields,
    answerKey,
    studentAnswers: { f1: 'photosynthesis', f2: 'mitochondria', f3: 'recorded' },
    maxScore: 100,
  });

  assert.equal(grade1.fieldGrades.length, 3);
  assert.equal(grade1.fieldGrades[0].isCorrect, true);
  assert.equal(grade1.fieldGrades[0].score, 40);
  assert.equal(grade1.fieldGrades[1].isCorrect, false);
  assert.equal(grade1.fieldGrades[1].score, 0);
  assert.equal(grade1.fieldGrades[2].isCorrect, true); // voice_record gets completion credit
  assert.ok(grade1.score >= 60, 'Score should reflect correct + voice');

  // Case 2: All correct
  const grade2 = calculateDeterministicGrade({
    interactiveFields,
    answerKey,
    studentAnswers: { f1: 'photosynthesis', f2: 'chloroplast', f3: 'done' },
    maxScore: 100,
  });
  assert.ok(grade2.score >= 90);
});

test('Grading: gradeInteractiveHomework falls back gracefully on unconfigured AI', async () => {
  const result = await gradeInteractiveHomework({
    homeworkTitle: 'Test Homework',
    category: 'writing',
    interactiveFields: [
      { id: 'f1', type: 'short_answer', expectedAnswer: 'Toshkent', points: 100 },
    ],
    answerKey: { f1: 'Toshkent' },
    studentAnswers: { f1: 'toshkent' }, // case-insensitive match
    maxScore: 100,
  });

  assert.ok(result);
  assert.equal(typeof result.score, 'number');
  assert.ok(result.score > 0);
  assert.ok(Array.isArray(result.fieldGrades));
  assert.equal(result.fieldGrades[0].isCorrect, true);
});

test('Controller: analyzeInteractiveHomework returns 400 when topic and content are missing', async () => {
  const req = { body: {} };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
  };

  await analyzeInteractiveHomework(req, res, () => {});
  assert.equal(statusCode, 400);
  assert.equal(responseData.success, false);
});

test('Controller: generateAnswers returns 400 when interactiveFields is empty', async () => {
  const req = { body: { title: 'Test', interactiveFields: [] } };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
  };

  await generateAnswers(req, res, () => {});
  assert.equal(statusCode, 400);
  assert.equal(responseData.success, false);
});

test('Student Sanitization: Homework attachments strip expectedAnswer and answerKey for students', async () => {
  const rawAttachments = {
    category: 'reading',
    readingPassage: 'A reading text about solar system.',
    interactiveFields: [
      { id: 'f1', type: 'fill_blank', question: 'The Earth orbits the ___.', expectedAnswer: 'Sun', points: 50 },
      { id: 'f2', type: 'multiple_choice', question: 'Select planet', options: ['Mars', 'Jupiter'], expectedAnswer: 'Mars', points: 50 },
    ],
    answerKey: { f1: 'Sun', f2: 'Mars' },
    allowVoiceRecord: true,
  };

  const mockHw = {
    id: 'hw_123',
    title: 'Solar System Reading',
    groupId: 'grp_1',
    centerId: 'c1',
    teacherId: 'teacher_1',
    attachments: rawAttachments,
  };

  const { prisma } = require('../src/config/db');
  const origHwFindFirst = prisma.homework.findFirst;
  const origGroupFindFirst = prisma.group.findFirst;
  const origUserFindUnique = prisma.user.findUnique;

  try {
    prisma.homework.findFirst = async () => mockHw;
    prisma.group.findFirst = async () => ({ id: 'grp_1', teacherId: 'teacher_1', centerId: 'c1' });
    prisma.user.findUnique = async () => ({ id: 'student_1', groupId: 'grp_1' });

    const reqStudent = {
      params: { id: 'hw_123' },
      user: { userId: 'student_1', role: 'student', centerId: 'c1' },
    };

    let studentResult = null;
    const resStudent = {
      status: () => resStudent,
      json: (data) => {
        studentResult = data;
        return resStudent;
      },
    };

    await getHomeworkById(reqStudent, resStudent, () => {});

    assert.equal(studentResult.success, true);
    const sanitizedAtt = studentResult.data.attachments;
    assert.equal(sanitizedAtt.answerKey, undefined, 'answerKey must be stripped for students');
    assert.equal(sanitizedAtt.interactiveFields[0].expectedAnswer, undefined, 'expectedAnswer must be stripped for students');
    assert.equal(sanitizedAtt.interactiveFields[0].question, 'The Earth orbits the ___.');
    assert.equal(sanitizedAtt.readingPassage, 'A reading text about solar system.');

    // Now simulate as teacher: answerKey should be present
    const reqTeacher = {
      params: { id: 'hw_123' },
      user: { userId: 'teacher_1', role: 'teacher', centerId: 'c1' },
    };

    let teacherResult = null;
    const resTeacher = {
      status: () => resTeacher,
      json: (data) => {
        teacherResult = data;
        return resTeacher;
      },
    };

    await getHomeworkById(reqTeacher, resTeacher, () => {});
    assert.equal(teacherResult.success, true);
    assert.ok(teacherResult.data.attachments.answerKey);
    assert.equal(teacherResult.data.attachments.interactiveFields[0].expectedAnswer, 'Sun');
  } finally {
    prisma.homework.findFirst = origHwFindFirst;
    prisma.group.findFirst = origGroupFindFirst;
    prisma.user.findUnique = origUserFindUnique;
  }
});

test('Submission: submitHomework saves interactive answers and audio recording', async () => {
  const { prisma } = require('../src/config/db');
  const origHwFindFirst = prisma.homework.findFirst;
  const origGroupFindFirst = prisma.group.findFirst;
  const origUserFindUnique = prisma.user.findUnique;
  const origSubmissionFindUnique = prisma.submission.findUnique;
  const origSubmissionCreate = prisma.submission.create;

  let createdSubmissionData = null;

  try {
    prisma.homework.findFirst = async () => ({
      id: 'hw_abc',
      title: 'Speaking Task',
      groupId: 'grp_1',
      dueDate: new Date(Date.now() + 86400000),
      centerId: 'c1',
      maxScore: 100,
      attachments: {
        category: 'speaking',
        interactiveFields: [{ id: 'sp1', type: 'voice_record', points: 100 }],
      },
    });

    prisma.group.findFirst = async () => ({ id: 'grp_1', teacherId: 'teacher_1', centerId: 'c1' });
    prisma.user.findUnique = async () => ({ id: 'std_42', groupId: 'grp_1' });
    prisma.submission.findUnique = async () => null; // New submission

    prisma.submission.create = async ({ data }) => {
      createdSubmissionData = data;
      return { id: 'sub_new', ...data };
    };

    prisma.submission.update = async ({ where, data }) => ({ id: where.id, ...data });
    prisma.user.update = async ({ where, data }) => ({ id: where.id, ...data });

    const req = {
      params: { homeworkId: 'hw_abc' },
      user: { userId: 'std_42', role: 'student', centerId: 'c1' },
      body: {
        interactiveAnswers: JSON.stringify({ sp1: 'Recorded voice answer' }),
        audioUrl: 'https://cdn.example.com/audio/voice.webm',
        answerText: 'Overall recitation',
      },
      files: [],
    };

    let resData = null;
    const res = {
      status: () => res,
      json: (data) => {
        resData = data;
        return res;
      },
    };

    await submitHomework(req, res, () => {});

    assert.equal(resData.success, true);
    assert.ok(createdSubmissionData);
    assert.equal(createdSubmissionData.status, 'submitted');

    const parsedContent = JSON.parse(createdSubmissionData.content);
    assert.equal(parsedContent.interactiveAnswers.sp1, 'Recorded voice answer');
    assert.equal(parsedContent.audioUrl, 'https://cdn.example.com/audio/voice.webm');
  } finally {
    prisma.homework.findFirst = origHwFindFirst;
    prisma.group.findFirst = origGroupFindFirst;
    prisma.user.findUnique = origUserFindUnique;
    prisma.submission.findUnique = origSubmissionFindUnique;
    prisma.submission.create = origSubmissionCreate;
  }
});

