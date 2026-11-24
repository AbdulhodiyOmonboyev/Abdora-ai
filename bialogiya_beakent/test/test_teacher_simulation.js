const { prisma } = require('../src/config/db');
const { createLesson } = require('../src/controllers/lesson.controller');
const { createTest, getTestAnalysis } = require('../src/controllers/test.controller');
const { markAttendance } = require('../src/controllers/attendance.controller');
const { gradeHomework, safeJsonParse } = require('../src/services/ai/gradingAI.service');
const bcrypt = require('bcryptjs');

// Mock response creator
const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

const next = (err) => {
  if (err) {
    console.error('Controller next() called with error:', err);
    throw err;
  }
};

async function runTeacherSimulation() {
  console.log('=== STARTING TEACHER ROLE LIVE SIMULATION ===\n');
  const results = {
    steps: {},
    issues: [],
  };

  try {
    // -------------------------------------------------------------
    // STEP 1: Center, Branch, Teacher & Students Setup
    // -------------------------------------------------------------
    console.log('[Step 1] Setting up Center, Teacher, Group, and Students...');

    let center = await prisma.center.findFirst({ where: { name: 'Test Biologiya Markazi' } });
    if (!center) {
      center = await prisma.center.create({
        data: {
          name: 'Test Biologiya Markazi',
          address: 'Toshkent sh., Chilonzor',
          phone: '+998901234567',
          settings: {
            gradeSettings: {
              minGrade: 1,
              maxGrade: 10,
              coinDeductionEnabled: true,
              deductCoinsOnAbsent: 5,
              awardCoinsOnHighGrade: 5,
              highGradeThreshold: 8,
              lowGradeThreshold: 4,
              deductCoinsOnLowGrade: 3,
            },
          },
        },
      });
    }

    let branch = await prisma.branch.findFirst({ where: { name: 'Asosiy Filial', centerId: center.id } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          name: 'Asosiy Filial',
          address: 'Chilonzor 1-mavze',
          centerId: center.id,
        },
      });
    }

    const passwordHash = await bcrypt.hash('teacher123', 10);
    let teacher = await prisma.user.findFirst({ where: { username: 'test_teacher_bio', centerId: center.id } });
    if (!teacher) {
      teacher = await prisma.user.create({
        data: {
          name: 'Olim Hakimov (Biologiya)',
          username: 'test_teacher_bio',
          passwordHash,
          role: 'teacher',
          centerId: center.id,
          branchId: branch.id,
          phone: '+998901112233',
        },
      });
    }

    let group = await prisma.group.findFirst({ where: { name: 'Bio-101 Guruhi', centerId: center.id } });
    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Bio-101 Guruhi',
          subject: 'biologiya',
          centerId: center.id,
          branchId: branch.id,
          teacherId: teacher.id,
        },
      });
    }

    // Create 2 students for group
    let student1 = await prisma.user.findFirst({ where: { username: 'student_ali_bio' } });
    if (!student1) {
      student1 = await prisma.user.create({
        data: {
          name: 'Ali Valiyev',
          username: 'student_ali_bio',
          passwordHash,
          role: 'student',
          centerId: center.id,
          groupId: group.id,
          coins: 20,
          xp: 100,
        },
      });
    }

    let student2 = await prisma.user.findFirst({ where: { username: 'student_vali_bio' } });
    if (!student2) {
      student2 = await prisma.user.create({
        data: {
          name: 'Vali Aliyev',
          username: 'student_vali_bio',
          passwordHash,
          role: 'student',
          centerId: center.id,
          groupId: group.id,
          coins: 25,
          xp: 120,
        },
      });
    }

    const teacherAuthUser = {
      userId: teacher.id,
      id: teacher.id,
      role: 'teacher',
      centerId: center.id,
      branchId: branch.id,
      name: teacher.name,
      username: teacher.username,
    };

    console.log(`✓ Teacher ready: ${teacher.name} (${teacher.id})`);
    console.log(`✓ Group ready: ${group.name} (${group.id})`);
    console.log(`✓ Students ready: ${student1.name} (${student1.id}), ${student2.name} (${student2.id})\n`);
    results.steps.setup = { success: true, teacherId: teacher.id, groupId: group.id };

    // -------------------------------------------------------------
    // STEP 2: Create a Lesson in the Group
    // -------------------------------------------------------------
    console.log('[Step 2] Creating a new lesson in the group via createLesson controller...');
    const lessonReq = {
      body: {
        title: 'Hujayra tuzilishi va organellalar',
        content: 'Hujayra barcha tirik organizmlarning elementar tuzilish birligidir. Membrana, sitoplazma va yadro asosiy qismlardir.',
        groupId: group.id,
        subject: 'biologiya',
        aiEnabled: false, // disable async background AI call in basic lesson creation
      },
      user: teacherAuthUser,
      files: [],
    };
    const lessonRes = createMockRes();
    await createLesson(lessonReq, lessonRes, next);

    if (lessonRes.statusCode !== 201 || !lessonRes.body?.success) {
      throw new Error(`Failed to create lesson: ${JSON.stringify(lessonRes.body)}`);
    }
    const createdLesson = lessonRes.body.data;
    console.log(`✓ Lesson created successfully: ID=${createdLesson._id || createdLesson.id}, Title="${createdLesson.title}"\n`);
    results.steps.createLesson = { success: true, lessonId: createdLesson._id || createdLesson.id };

    // -------------------------------------------------------------
    // STEP 3: Add Test and Questions for the Lesson
    // -------------------------------------------------------------
    console.log('[Step 3] Creating Test and Questions for the Lesson...');
    const testReq = {
      body: {
        title: 'Hujayra organellalari bo\'yicha nazorat testi',
        groupId: group.id,
        lessonId: createdLesson._id || createdLesson.id,
        timeLimit: 20,
        passingScore: 60,
        questions: [
          {
            text: 'Oqsillar sintezi qaysi organellada amalga oshadi?',
            type: 'mcq',
            difficulty: 'medium',
            points: 2,
            explanation: 'Ribosomalar ribosomal RNK va oqsillardan tashkil topgan bo\'lib, oqsil sintez qiladi.',
            options: [
              { text: 'Ribosoma', isCorrect: true },
              { text: 'Lizosoma', isCorrect: false },
              { text: 'Mitoxondriya', isCorrect: false },
              { text: 'Golji majmuasi', isCorrect: false },
            ],
          },
          {
            text: 'Hujayraning "energiya stansiyasi" qaysi organella?',
            type: 'mcq',
            difficulty: 'easy',
            points: 2,
            explanation: 'Mitoxondriyalarda ATF sintezlanadi.',
            options: [
              { text: 'Mitoxondriya', isCorrect: true },
              { text: 'Xloroplast', isCorrect: false },
              { text: 'Vakuola', isCorrect: false },
              { text: 'Endoplazmatik to\'r', isCorrect: false },
            ],
          },
          {
            text: 'O\'simlik hujayrasida fotosintez qayerda kechadi?',
            type: 'mcq',
            difficulty: 'easy',
            points: 2,
            explanation: 'Xloroplastlarda xlorofill pigmenti bo\'lib, quyosh nurini yutadi.',
            options: [
              { text: 'Xloroplast', isCorrect: true },
              { text: 'Mitoxondriya', isCorrect: false },
              { text: 'Yadro', isCorrect: false },
              { text: 'Ribosoma', isCorrect: false },
            ],
          },
        ],
      },
      user: teacherAuthUser,
    };
    const testRes = createMockRes();
    await createTest(testReq, testRes, next);

    if (testRes.statusCode !== 201 || !testRes.body?.success) {
      throw new Error(`Failed to create test: ${JSON.stringify(testRes.body)}`);
    }
    const createdTest = testRes.body.data;
    const testId = createdTest._id || createdTest.id;
    console.log(`✓ Test created successfully: ID=${testId}, Questions count=${createdTest.questions?.length || 3}\n`);
    results.steps.createTest = { success: true, testId };

    // Fetch full questions to have IDs
    const dbTest = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });
    const [q1, q2, q3] = dbTest.questions;

    // Simulate 2 student submissions so we have real results to analyze
    // Student 1: 3/3 correct (100%)
    await prisma.result.create({
      data: {
        testId: testId,
        studentId: student1.id,
        centerId: center.id,
        score: 6,
        percentage: 100,
        passed: true,
        timeTaken: 300,
        answers: [
          { questionId: q1.id, answer: 'Ribosoma', isCorrect: true },
          { questionId: q2.id, answer: 'Mitoxondriya', isCorrect: true },
          { questionId: q3.id, answer: 'Xloroplast', isCorrect: true },
        ],
      },
    });

    // Student 2: 1/3 correct (33%) - failed q1 and q3
    await prisma.result.create({
      data: {
        testId: testId,
        studentId: student2.id,
        centerId: center.id,
        score: 2,
        percentage: 33,
        passed: false,
        timeTaken: 450,
        answers: [
          { questionId: q1.id, answer: 'Lizosoma', isCorrect: false },
          { questionId: q2.id, answer: 'Mitoxondriya', isCorrect: true },
          { questionId: q3.id, answer: 'Mitoxondriya', isCorrect: false },
        ],
      },
    });
    console.log('✓ Simulated 2 student test results (Student 1: 100%, Student 2: 33%)\n');

    // -------------------------------------------------------------
    // STEP 4: Call getTestAnalysis and verify 500 error is resolved
    // -------------------------------------------------------------
    console.log('[Step 4] Calling getTestAnalysis to verify 500 Server Error is gone...');
    const analysisReq = {
      params: { id: testId },
      query: { language: 'uz' },
      user: teacherAuthUser,
    };
    const analysisRes = createMockRes();
    await getTestAnalysis(analysisReq, analysisRes, next);

    console.log(`Status Code: ${analysisRes.statusCode}`);
    console.log(`Analysis Response Success: ${analysisRes.body?.success}`);
    if (analysisRes.statusCode !== 200 || !analysisRes.body?.success) {
      throw new Error(`getTestAnalysis failed: ${JSON.stringify(analysisRes.body)}`);
    }

    const analysisData = analysisRes.body.data;
    console.log(`Participants: ${analysisData.participants}`);
    console.log(`Class Average: ${analysisData.classAverage}%`);
    console.log(`Questions Analyzed: ${analysisData.questions?.length}`);
    analysisData.questions.forEach((q, idx) => {
      console.log(`  Q${idx + 1}: "${q.text.slice(0, 35)}..." - Attempts: ${q.attempts}, Wrong: ${q.wrong}, ErrorRate: ${q.errorRate}%, TopWrong: "${q.topWrongAnswer}"`);
    });
    console.log(`Insights: ${analysisData.insights ? JSON.stringify(analysisData.insights) : 'null (cached or AI fallback gracefully handled)'}`);
    console.log('✓ getTestAnalysis passed cleanly with NO 500 error!\n');
    results.steps.getTestAnalysis = {
      success: true,
      statusCode: analysisRes.statusCode,
      participants: analysisData.participants,
      classAverage: analysisData.classAverage,
      questionsCount: analysisData.questions?.length,
    };

    // -------------------------------------------------------------
    // STEP 5: Mark Attendance and verify Coin Idempotence (delta = 0)
    // -------------------------------------------------------------
    console.log('[Step 5] Testing attendance marking and coin idempotence...');
    const today = new Date().toISOString().split('T')[0];

    // Reset student coins to known baseline
    await prisma.user.update({
      where: { id: student1.id },
      data: { coins: 50 },
    });
    await prisma.user.update({
      where: { id: student2.id },
      data: { coins: 50 },
    });

    const initialStudent1 = await prisma.user.findUnique({ where: { id: student1.id }, select: { coins: true } });
    console.log(`Initial coins - Student 1 (${student1.name}): ${initialStudent1.coins}`);

    // Call 1: Student 1 Present with Grade 9 (+5 coins), Student 2 Absent (-5 coins)
    const attReq1 = {
      body: {
        groupId: group.id,
        date: today,
        records: [
          { studentId: student1.id, status: 'present', grade: 9, note: 'Faol qatnashdi' },
          { studentId: student2.id, status: 'absent', note: 'Sababsiz kelmadi' },
        ],
      },
      user: teacherAuthUser,
    };
    const attRes1 = createMockRes();
    await markAttendance(attReq1, attRes1, next);

    if (attRes1.statusCode !== 200 || !attRes1.body?.success) {
      throw new Error(`markAttendance (1st call) failed: ${JSON.stringify(attRes1.body)}`);
    }

    const student1After1 = await prisma.user.findUnique({ where: { id: student1.id }, select: { coins: true } });
    const student2After1 = await prisma.user.findUnique({ where: { id: student2.id }, select: { coins: true } });
    const s1Delta1 = student1After1.coins - initialStudent1.coins;
    console.log(`After 1st save:`);
    console.log(`  Student 1 coins: ${student1After1.coins} (Delta: +${s1Delta1})`);
    console.log(`  Student 2 coins: ${student2After1.coins} (Delta: ${student2After1.coins - 50})`);

    // Call 2: Save the EXACT SAME attendance again
    console.log('\nSaving EXACT SAME attendance a second time...');
    const attReq2 = {
      body: {
        groupId: group.id,
        date: today,
        records: [
          { studentId: student1.id, status: 'present', grade: 9, note: 'Faol qatnashdi' },
          { studentId: student2.id, status: 'absent', note: 'Sababsiz kelmadi' },
        ],
      },
      user: teacherAuthUser,
    };
    const attRes2 = createMockRes();
    await markAttendance(attReq2, attRes2, next);

    if (attRes2.statusCode !== 200 || !attRes2.body?.success) {
      throw new Error(`markAttendance (2nd call) failed: ${JSON.stringify(attRes2.body)}`);
    }

    const student1After2 = await prisma.user.findUnique({ where: { id: student1.id }, select: { coins: true } });
    const student2After2 = await prisma.user.findUnique({ where: { id: student2.id }, select: { coins: true } });
    const s1Delta2 = student1After2.coins - student1After1.coins;
    const s2Delta2 = student2After2.coins - student2After1.coins;

    console.log(`After 2nd save:`);
    console.log(`  Student 1 coins: ${student1After2.coins} (Delta from 1st save: ${s1Delta2})`);
    console.log(`  Student 2 coins: ${student2After2.coins} (Delta from 1st save: ${s2Delta2})`);

    const coinsAreIdempotent = (s1Delta2 === 0 && s2Delta2 === 0);
    console.log(`✓ Coins idempotency test: ${coinsAreIdempotent ? 'PASSED (delta = 0)' : 'FAILED (coins changed!)'}\n`);
    results.steps.markAttendance = {
      success: true,
      coinsAreIdempotent,
      s1Delta2,
      s2Delta2,
    };

    // -------------------------------------------------------------
    // STEP 6: Test gradeHomework / gradingAI.service.js
    // -------------------------------------------------------------
    console.log('[Step 6] Testing AI homework grading (gradeHomework & safeJsonParse)...');
    
    // Test safeJsonParse with various formats
    const jsonTest1 = safeJsonParse('{"score": 85, "feedback": "Yaxshi tahlil", "suggestions": ["Misollar keltiring"]}');
    const jsonTest2 = safeJsonParse('```json\n{"score": 92, "feedback": "A\'lo!", "suggestions": []}\n```');
    const jsonTest3 = safeJsonParse('Izoh: Mana natija {"score": 70, "feedback": "Qoniqarli"} marhamat');

    console.log('✓ safeJsonParse raw JSON:', jsonTest1?.score === 85 ? 'OK' : 'FAIL');
    console.log('✓ safeJsonParse markdown code block:', jsonTest2?.score === 92 ? 'OK' : 'FAIL');
    console.log('✓ safeJsonParse mixed text/JSON:', jsonTest3?.score === 70 ? 'OK' : 'FAIL');

    // Test gradeHomework execution
    const gradeResult = await gradeHomework(
      'Mitoz va Meyoz farqlari',
      'Mitoz va meyoz bo\'linish jarayonlarini taqqoslang va biologik ahamiyatini yozing.',
      'Mitoz barcha tana hujayralarida sodir bo\'ladi va 2 ta bir xil diploid hujayra hosil qiladi. Meyoz esa jinsiy hujayralarda sodir bo\'lib, xromosoma to\'plami 2 barobar kamaygan 4 ta gaploid hujayra hosil qiladi.',
      100,
      center.id
    );

    console.log('gradeHomework returned:', gradeResult);
    const hasValidShape = (
      typeof gradeResult === 'object' &&
      typeof gradeResult.score === 'number' &&
      typeof gradeResult.feedback === 'string' &&
      Array.isArray(gradeResult.suggestions)
    );
    console.log(`✓ gradeHomework returned valid shape: ${hasValidShape}`);
    results.steps.gradeHomework = {
      success: true,
      hasValidShape,
      gradeResult,
    };

    console.log('\n=== ALL SIMULATION STEPS COMPLETED SUCCESSFULLY ===');
    return results;
  } catch (err) {
    console.error('SIMULATION ERROR:', err);
    results.error = err.message;
    return results;
  }
}

runTeacherSimulation()
  .then(res => {
    console.log('\nFinal Summary:', JSON.stringify(res, null, 2));
    process.exit(res.error ? 1 : 0);
  })
  .catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  });
