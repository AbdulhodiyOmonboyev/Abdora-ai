const test = require('node:test');
const assert = require('node:assert/strict');
const { XP_REWARDS, COIN_REWARDS } = require('../src/services/gamification.service');
const { submitStepProgress, finishLessonQuiz, completeLesson } = require('../src/controllers/lesson.controller');
const { prisma } = require('../src/config/db');
const router = require('../src/routes/lesson.routes');

test('Gamification: Duolingo step and quiz finish rewards are configured correctly', () => {
  assert.equal(XP_REWARDS.step_complete, 5, 'Step complete should award 5 XP');
  assert.equal(XP_REWARDS.quiz_finish, 30, 'Quiz finish with mastery should award 30 XP');
  assert.equal(COIN_REWARDS.quiz_finish, 5, 'Quiz finish with mastery should award 5 coins');
  assert.equal(COIN_REWARDS.step_complete, 0, 'Regular step should not award extra coins');
});

test('Lesson Controller: submitStepProgress handles correct answer (+5 XP and records step)', async () => {
  const origLessonFindUnique = prisma.lesson.findUnique;
  const origUserFindUnique = prisma.user.findUnique;
  const origUserUpdate = prisma.user.update;

  let updatedAchievements = null;

  try {
    prisma.lesson.findUnique = async () => ({ id: 'lesson-123', title: 'Hujayra tuzilishi' });
    prisma.user.findUnique = async () => ({
      id: 'student-1',
      xp: 100,
      coins: 20,
      level: 1,
      streakCurrent: 3,
      streakLongest: 5,
      streakLastDate: new Date(),
      achievements: { completedLessons: [] },
    });
    prisma.user.update = async ({ where, data }) => {
      if (data.achievements) updatedAchievements = data.achievements;
      return { id: where.id, ...data };
    };

    const req = {
      params: { id: 'lesson-123' },
      user: { userId: 'student-1' },
      body: {
        stepId: 'step_concept_1',
        stepType: 'concept',
        isCorrect: true,
        userAnswer: 'A',
        timeSpent: 12,
      },
    };

    let responseBody = null;
    let responseStatus = 200;
    const res = {
      status(code) { responseStatus = code; return this; },
      json(body) { responseBody = body; return this; },
    };
    const next = (err) => { if (err) throw err; };

    await submitStepProgress(req, res, next);

    assert.equal(responseStatus, 200);
    assert.equal(responseBody.success, true);
    assert.equal(responseBody.data.success, true);
    assert.equal(responseBody.data.xpEarned, 5);
    assert.equal(responseBody.data.currentStep, 'step_concept_1');
    assert.equal(responseBody.data.mistakesCount, 0);
    assert.equal(responseBody.data.totalStepsCompleted, 1);

    // Verify achievements data was saved
    assert.ok(updatedAchievements);
    const progress = updatedAchievements.lessonProgress['lesson-123'];
    assert.ok(progress);
    assert.deepEqual(progress.completedSteps, ['step_concept_1']);
    assert.equal(progress.mistakes.length, 0);
  } finally {
    prisma.lesson.findUnique = origLessonFindUnique;
    prisma.user.findUnique = origUserFindUnique;
    prisma.user.update = origUserUpdate;
  }
});

test('Lesson Controller: submitStepProgress handles wrong answer (records to mistakes list and 0 XP)', async () => {
  const origLessonFindUnique = prisma.lesson.findUnique;
  const origUserFindUnique = prisma.user.findUnique;
  const origUserUpdate = prisma.user.update;

  let updatedUserData = null;

  try {
    prisma.lesson.findUnique = async () => ({ id: 'lesson-123', title: 'Hujayra tuzilishi' });
    prisma.user.findUnique = async () => ({
      id: 'student-1',
      xp: 100,
      coins: 20,
      level: 1,
      streakCurrent: 3,
      streakLongest: 5,
      streakLastDate: new Date(),
      achievements: {
        lessonProgress: {
          'lesson-123': {
            completedSteps: ['step_concept_1'],
            mistakes: [],
          },
        },
      },
    });
    prisma.user.update = async ({ where, data }) => {
      updatedUserData = data;
      return { id: where.id, ...data };
    };

    const req = {
      params: { id: 'lesson-123' },
      user: { userId: 'student-1' },
      body: {
        stepId: 'step_mc_2',
        stepType: 'multiple_choice',
        isCorrect: false,
        userAnswer: 'wrong-opt',
        timeSpent: 8,
      },
    };

    let responseBody = null;
    const res = {
      status() { return this; },
      json(body) { responseBody = body; return this; },
    };
    const next = (err) => { if (err) throw err; };

    await submitStepProgress(req, res, next);

    assert.equal(responseBody.data.success, true);
    assert.equal(responseBody.data.xpEarned, 0);
    assert.equal(responseBody.data.currentStep, 'step_mc_2');
    assert.equal(responseBody.data.mistakesCount, 1);
    assert.equal(responseBody.data.totalStepsCompleted, 1);

    const progress = updatedUserData.achievements.lessonProgress['lesson-123'];
    assert.equal(progress.mistakes.length, 1);
    assert.equal(progress.mistakes[0].stepId, 'step_mc_2');
    assert.equal(progress.mistakes[0].userAnswer, 'wrong-opt');
  } finally {
    prisma.lesson.findUnique = origLessonFindUnique;
    prisma.user.findUnique = origUserFindUnique;
    prisma.user.update = origUserUpdate;
  }
});

test('Lesson Controller: finishLessonQuiz with mastery >= 70% awards +30 XP, 5 coins, marks mastered, updates streak', async () => {
  const origLessonFindUnique = prisma.lesson.findUnique;
  const origUserFindUnique = prisma.user.findUnique;
  const origUserUpdate = prisma.user.update;

  let updatedAchievements = null;

  try {
    prisma.lesson.findUnique = async () => ({ id: 'lesson-duo', title: 'Genetika asoslari' });
    prisma.user.findUnique = async () => ({
      id: 'student-1',
      xp: 200,
      coins: 10,
      level: 1,
      streakCurrent: 4,
      streakLongest: 5,
      streakLastDate: new Date(),
      achievements: { completedLessons: [] },
    });
    prisma.user.update = async ({ where, data }) => {
      if (data.achievements) updatedAchievements = data.achievements;
      return { id: where.id, ...data };
    };

    const req = {
      params: { id: 'lesson-duo' },
      user: { userId: 'student-1' },
      body: {
        score: 8,
        totalQuestions: 10,
        answers: ['A', 'B', 'C', 'D'],
        mistakes: [{ questionId: 'q2', chosen: 'B' }],
        timeSpent: 120,
      },
    };

    let responseBody = null;
    const res = {
      status() { return this; },
      json(body) { responseBody = body; return this; },
    };
    const next = (err) => { if (err) throw err; };

    await finishLessonQuiz(req, res, next);

    assert.equal(responseBody.data.success, true);
    assert.equal(responseBody.data.masteryPercent, 80);
    assert.equal(responseBody.data.isMastered, true);
    assert.equal(responseBody.data.score, 8);
    assert.equal(responseBody.data.xpEarned, 30);
    assert.equal(responseBody.data.coinsEarned, 5);
    assert.ok(responseBody.data.streakCurrent >= 1);

    // Verify completedLessons and masteredLessons
    assert.ok(updatedAchievements.completedLessons.includes('lesson-duo'));
    assert.ok(updatedAchievements.masteredLessons.includes('lesson-duo'));
    assert.equal(updatedAchievements.lessonProgress['lesson-duo'].isMastered, true);
  } finally {
    prisma.lesson.findUnique = origLessonFindUnique;
    prisma.user.findUnique = origUserFindUnique;
    prisma.user.update = origUserUpdate;
  }
});

test('Lesson Controller: finishLessonQuiz with mastery < 70% does not mark mastered and gives 0 bonus', async () => {
  const origLessonFindUnique = prisma.lesson.findUnique;
  const origUserFindUnique = prisma.user.findUnique;
  const origUserUpdate = prisma.user.update;

  let updatedAchievements = null;

  try {
    prisma.lesson.findUnique = async () => ({ id: 'lesson-duo', title: 'Genetika asoslari' });
    prisma.user.findUnique = async () => ({
      id: 'student-1',
      xp: 200,
      coins: 10,
      level: 1,
      streakCurrent: 4,
      streakLongest: 5,
      streakLastDate: new Date(),
      achievements: { completedLessons: [] },
    });
    prisma.user.update = async ({ where, data }) => {
      if (data.achievements) updatedAchievements = data.achievements;
      return { id: where.id, ...data };
    };

    const req = {
      params: { id: 'lesson-duo' },
      user: { userId: 'student-1' },
      body: {
        score: 3,
        totalQuestions: 5, // 60% < 70%
        answers: ['A', 'B'],
        mistakes: [{ questionId: 'q1' }, { questionId: 'q2' }],
        timeSpent: 60,
      },
    };

    let responseBody = null;
    const res = {
      status() { return this; },
      json(body) { responseBody = body; return this; },
    };
    const next = (err) => { if (err) throw err; };

    await finishLessonQuiz(req, res, next);

    assert.equal(responseBody.data.success, true);
    assert.equal(responseBody.data.masteryPercent, 60);
    assert.equal(responseBody.data.isMastered, false);
    assert.equal(responseBody.data.score, 3);
    assert.equal(responseBody.data.xpEarned, 0);
    assert.equal(responseBody.data.coinsEarned, 0);

    // Verify completedLessons does NOT include the lesson
    assert.equal(updatedAchievements.completedLessons.includes('lesson-duo'), false);
    assert.equal(updatedAchievements.lessonProgress['lesson-duo'].isMastered, false);
  } finally {
    prisma.lesson.findUnique = origLessonFindUnique;
    prisma.user.findUnique = origUserFindUnique;
    prisma.user.update = origUserUpdate;
  }
});

test('Lesson Routes: /:id/step-submit and /:id/quiz-finish are registered', () => {
  const routes = router.stack.map(layer => ({
    path: layer.route?.path,
    methods: layer.route ? Object.keys(layer.route.methods) : [],
  }));

  const stepSubmitRoute = routes.find(r => r.path === '/:id/step-submit');
  assert.ok(stepSubmitRoute, 'Route /:id/step-submit must be registered');
  assert.ok(stepSubmitRoute.methods.includes('post'), '/:id/step-submit must support POST');

  const quizFinishRoute = routes.find(r => r.path === '/:id/quiz-finish');
  assert.ok(quizFinishRoute, 'Route /:id/quiz-finish must be registered');
  assert.ok(quizFinishRoute.methods.includes('post'), '/:id/quiz-finish must support POST');
});

test('Lesson Controller: completeLesson awards +50 XP on first completion and handles alreadyCompleted=true cleanly', async () => {
  const origLessonFindUnique = prisma.lesson.findUnique;
  const origUserFindUnique = prisma.user.findUnique;
  const origUserUpdate = prisma.user.update;

  try {
    let state = {
      id: 'student-1',
      xp: 120,
      coins: 15,
      level: 1,
      streakCurrent: 2,
      streakLongest: 4,
      streakLastDate: new Date(),
      achievements: { completedLessons: [] },
    };

    prisma.lesson.findUnique = async () => ({ id: 'lesson-complete-1', title: 'Mitoxondriya' });
    prisma.user.findUnique = async () => ({ ...state });
    prisma.user.update = async ({ data }) => {
      state = { ...state, ...data };
      return state;
    };

    const req = { params: { id: 'lesson-complete-1' }, user: { userId: 'student-1' } };
    let firstRes = null;
    const res1 = {
      status() { return this; },
      json(body) { firstRes = body; return this; },
    };
    const next = (err) => { if (err) throw err; };

    await completeLesson(req, res1, next);
    assert.equal(firstRes.data.completed, true);
    assert.equal(firstRes.data.alreadyCompleted, false);
    assert.equal(firstRes.data.xpGained, 50);
    assert.equal(firstRes.data.completedLessonIds.includes('lesson-complete-1'), true);

    // Second call (e.g. Stage 4 after finishLessonQuiz already marked lesson completed)
    let secondRes = null;
    const res2 = {
      status() { return this; },
      json(body) { secondRes = body; return this; },
    };
    await completeLesson(req, res2, next);
    assert.equal(secondRes.data.completed, true);
    assert.equal(secondRes.data.alreadyCompleted, true);
    assert.equal(secondRes.data.xpGained, 0);
    assert.equal(secondRes.data.coins, state.coins);
  } finally {
    prisma.lesson.findUnique = origLessonFindUnique;
    prisma.user.findUnique = origUserFindUnique;
    prisma.user.update = origUserUpdate;
  }
});
