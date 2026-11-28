const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const userController = require('../src/controllers/user.controller');

describe('User Avatar & Profile Tests', () => {
  test('uploadAvatar, getAvatar, and scanAvatarFace functions are properly exported', () => {
    assert.strictEqual(typeof userController.uploadAvatar, 'function');
    assert.strictEqual(typeof userController.getAvatar, 'function');
    assert.strictEqual(typeof userController.updateProfile, 'function');
    assert.strictEqual(typeof userController.scanAvatarFace, 'function');
  });

  test('uploadAvatar rejects request without file', async () => {
    let statusCode = null;
    let responseBody = null;

    const req = {
      user: { userId: 'student_123', centerId: 'center_1' },
      file: null,
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await userController.uploadAvatar(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody?.success, false);
    assert.match(responseBody?.message, /fayli yuklanmadi/i);
  });

  test('scanAvatarFace rejects request without file', async () => {
    let statusCode = null;
    let responseBody = null;

    const req = {
      user: { userId: 'student_123', centerId: 'center_1' },
      file: null,
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      },
    };

    await userController.scanAvatarFace(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(responseBody?.success, false);
    assert.match(responseBody?.message, /fayli yuklanmadi/i);
  });

  test('saveAvatarConfig persists isSaved: true and enforces +200 XP lock on identity edits', async () => {
    const { prisma } = require('../src/config/db');
    const origFindUnique = prisma.user.findUnique;
    const origUpdate = prisma.user.update;
    const origCenterFind = prisma.center.findUnique;

    let storedPermissions = {};
    let currentXp = 100;
    let centerAvatarEnabled = true;

    try {
      prisma.center.findUnique = async () => ({
        settings: { features: { avatarEnabled: centerAvatarEnabled } },
      });
      prisma.user.findUnique = async () => ({
        id: 'stu_1',
        role: 'student',
        centerId: 'c_1',
        xp: currentXp,
        name: 'Ali',
        permissions: storedPermissions,
      });
      prisma.user.update = async ({ data }) => {
        storedPermissions = data.permissions;
        return {
          id: 'stu_1',
          role: 'student',
          xp: currentXp,
          name: 'Ali',
          permissions: storedPermissions,
        };
      };

      const makeRes = () => {
        const out = { statusCode: 200, body: null };
        out.res = {
          status(code) { out.statusCode = code; return this; },
          json(data) { out.body = data; return this; },
        };
        return out;
      };

      // 1. Initial save sets isSaved: true
      const r1 = makeRes();
      await userController.saveAvatarConfig(
        { user: { userId: 'stu_1', role: 'student' }, body: { name: 'Temur', profession: 'Shifokor', config: { gender: 'boy' } } },
        r1.res,
        (e) => { throw e; }
      );
      assert.strictEqual(r1.statusCode, 200);
      assert.strictEqual(r1.body?.data?.avatarProfile?.isSaved, true);
      assert.strictEqual(storedPermissions.avatarProfile.isSaved, true);

      // 2. Attempting to change profession before +200 XP fails with 400
      currentXp = 250; // needs 100 + 200 = 300
      const r2 = makeRes();
      await userController.saveAvatarConfig(
        { user: { userId: 'stu_1', role: 'student' }, body: { name: 'Temur', profession: 'Muhandis', config: { gender: 'boy' } } },
        r2.res,
        (e) => { throw e; }
      );
      assert.strictEqual(r2.statusCode, 400);

      // 3. After reaching 300 XP, changing profession succeeds
      currentXp = 300;
      const r3 = makeRes();
      await userController.saveAvatarConfig(
        { user: { userId: 'stu_1', role: 'student' }, body: { name: 'Temur', profession: 'Muhandis', config: { gender: 'boy' } } },
        r3.res,
        (e) => { throw e; }
      );
      assert.strictEqual(r3.statusCode, 200);
      assert.strictEqual(r3.body?.data?.avatarProfile?.profession, 'Muhandis');
      assert.strictEqual(r3.body?.data?.avatarProfile?.savedAtXp, 300);

      // 4. Non-students (admin/teacher/manager) are blocked with 403
      const r4 = makeRes();
      await userController.saveAvatarConfig(
        { user: { userId: 'adm_1', role: 'admin' }, body: { name: 'AdminAv', profession: 'Admin', config: {} } },
        r4.res,
        (e) => { throw e; }
      );
      assert.strictEqual(r4.statusCode, 403);

      // 5. When center disables avatarEnabled = false, student gets 403
      centerAvatarEnabled = false;
      const r5 = makeRes();
      await userController.saveAvatarConfig(
        { user: { userId: 'stu_1', role: 'student' }, body: { name: 'Temur', profession: 'Muhandis', config: {} } },
        r5.res,
        (e) => { throw e; }
      );
      assert.strictEqual(r5.statusCode, 403);
      assert.match(r5.body?.message, /o'chirilgan/i);
    } finally {
      prisma.user.findUnique = origFindUnique;
      prisma.user.update = origUpdate;
      prisma.center.findUnique = origCenterFind;
    }
  });

  test('Avatar AI enforces student-only access, completed-lessons-only knowledge, and mutual Q&A', async () => {
    const { prisma } = require('../src/config/db');
    const avatarAi = require('../src/controllers/avatarAi.controller');
    const origUserFind = prisma.user.findUnique;
    const origLessonFindMany = prisma.lesson.findMany;

    const makeRes = () => {
      const out = { statusCode: 200, body: null };
      out.res = {
        status(code) { out.statusCode = code; return this; },
        json(data) { out.body = data; return this; },
      };
      return out;
    };

    try {
      // 1. Admin/Teacher rejected with 403
      const rAdmin = makeRes();
      await avatarAi.avatarChat({ user: { userId: 'adm_1', role: 'admin' }, body: { message: 'Salom' } }, rAdmin.res);
      assert.strictEqual(rAdmin.statusCode, 403);

      // 2. Student with 0 completed lessons cannot get unstudied subject answers
      let completedIds = [];
      prisma.user.findUnique = async () => ({
        id: 'stu_qa',
        name: 'Jasur',
        role: 'student',
        xp: 50,
        level: 1,
        centerId: 'c1',
        groupId: 'g1',
        permissions: { avatarProfile: { name: 'Zukko', profession: 'Biolog', isSaved: true } },
        achievements: { completedLessons: completedIds },
        group: { id: 'g1', name: 'Bio-1', subject: 'Biologiya' },
      });

      prisma.lesson.findMany = async () => [
        {
          id: 'les_1',
          title: 'Hujayra tuzilishi',
          subject: 'Biologiya',
          order: 1,
          content: 'Mitoxondriya hujayraning energiya stansiyasi hisoblanadi. Yadro esa irsiy axborotni saqlaydi.',
          aiContent: {
            quiz: [
              {
                question: 'Hujayraning energiya stansiyasi qaysi organoid?',
                correctAnswer: 'Mitoxondriya',
              },
            ],
          },
        },
        {
          id: 'les_2',
          title: 'DNK replikatsiyasi',
          subject: 'Biologiya',
          order: 2,
          content: 'DNK ikki zanjirli spiral bo\'lib, nukleotidlardan tashkil topgan.',
          aiContent: {},
        },
      ];

      const rZero = makeRes();
      await avatarAi.avatarChat(
        { user: { userId: 'stu_qa', role: 'student', centerId: 'c1' }, body: { message: 'Mitoxondriya nima?' } },
        rZero.res
      );
      assert.strictEqual(rZero.statusCode, 200);
      assert.strictEqual(rZero.body?.data?.completedCount, 0);
      assert.match(rZero.body?.data?.reply, /0 ta dars|o'tgan darslarni bilaman/i);

      // 3. Now student completes les_1 ONLY (les_2 is still uncompleted!)
      completedIds = ['les_1'];

      // Asking about uncompleted les_2 ("DNK replikatsiyasi") is strictly refused!
      const rUncompleted = makeRes();
      await avatarAi.avatarChat(
        { user: { userId: 'stu_qa', role: 'student', centerId: 'c1' }, body: { message: 'DNK replikatsiyasi haqida aytib ber' } },
        rUncompleted.res
      );
      assert.strictEqual(rUncompleted.statusCode, 200);
      assert.match(rUncompleted.body?.data?.reply, /DNK replikatsiyasi.*o'tmadik/i);

      // Asking Avatar to quiz student (mode: 'ask_student') returns a question from les_1!
      const rAsk = makeRes();
      await avatarAi.avatarChat(
        { user: { userId: 'stu_qa', role: 'student', centerId: 'c1' }, body: { mode: 'ask_student' } },
        rAsk.res
      );
      assert.strictEqual(rAsk.statusCode, 200);
      assert.ok(rAsk.body?.data?.activeQuiz);
      assert.strictEqual(rAsk.body?.data?.activeQuiz?.lessonId, 'les_1');

      // Student answers Avatar's question (mode: 'check_answer')
      const rCheck = makeRes();
      await avatarAi.avatarChat(
        {
          user: { userId: 'stu_qa', role: 'student', centerId: 'c1' },
          body: {
            mode: 'check_answer',
            message: 'Mitoxondriya',
            activeQuiz: {
              lessonId: 'les_1',
              lessonTitle: 'Hujayra tuzilishi',
              question: 'Hujayraning energiya stansiyasi qaysi organoid?',
              expectedAnswer: 'Mitoxondriya',
            },
          },
        },
        rCheck.res
      );
      assert.strictEqual(rCheck.statusCode, 200);
      assert.strictEqual(rCheck.body?.data?.isCorrect, true);
      assert.strictEqual(rCheck.body?.data?.activeQuiz, null);
    } finally {
      prisma.user.findUnique = origUserFind;
      prisma.lesson.findMany = origLessonFindMany;
    }
  });

  test('getLessons scopes fallback strictly to student centerId and groupId: null', async () => {
    const { prisma } = require('../src/config/db');
    const lessonController = require('../src/controllers/lesson.controller');
    const origUserFind = prisma.user.findUnique;
    const origLessonFindMany = prisma.lesson.findMany;

    const capturedQueries = [];
    try {
      prisma.user.findUnique = async () => ({ id: 'stu_1', groupId: 'grp_empty', centerId: 'center_A' });
      prisma.lesson.findMany = async (args) => {
        capturedQueries.push(args.where);
        return [];
      };

      let body = null;
      const res = { status() { return this; }, json(d) { body = d; return this; } };
      await lessonController.getLessons(
        { query: {}, user: { userId: 'stu_1', role: 'student', centerId: 'center_A' } },
        res,
        (e) => { throw e; }
      );

      assert.strictEqual(capturedQueries.length, 2);
      assert.strictEqual(capturedQueries[1].centerId, 'center_A');
      assert.strictEqual(capturedQueries[1].groupId, null);
      assert.deepStrictEqual(body?.data, []);
    } finally {
      prisma.user.findUnique = origUserFind;
      prisma.lesson.findMany = origLessonFindMany;
    }
  });
});
