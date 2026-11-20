const { prisma } = require('./src/config/db');
const { createHomework, getSubmissions, gradeSubmission, submitHomework } = require('./src/controllers/homework.controller');
const { getTestResults, getTests } = require('./src/controllers/test.controller');
const { getAttendanceByGroup } = require('./src/controllers/attendance.controller');

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
    console.error('Controller next() error:', err);
    throw err;
  }
};

async function testFullLifecycle() {
  console.log('=== TESTING TEACHER EXTENDED LIFECYCLE ===\n');

  // Find existing teacher and group
  const teacher = await prisma.user.findFirst({ where: { username: 'test_teacher_bio' } });
  const student = await prisma.user.findFirst({ where: { username: 'student_ali_bio' } });
  const group = await prisma.group.findFirst({ where: { name: 'Bio-101 Guruhi' } });

  const teacherAuthUser = {
    userId: teacher.id,
    id: teacher.id,
    role: 'teacher',
    centerId: teacher.centerId,
    branchId: teacher.branchId,
    name: teacher.name,
    username: teacher.username,
  };

  const studentAuthUser = {
    userId: student.id,
    id: student.id,
    role: 'student',
    centerId: student.centerId,
    groupId: group.id,
    name: student.name,
    username: student.username,
  };

  // 1. Teacher creates Homework
  console.log('[1] Teacher creates Homework...');
  const hwReq = {
    body: {
      title: 'Hujayra organellalari bo\'yicha diagramma chizish',
      description: 'O\'simlik va hayvon hujayrasining farqlarini jadval ko\'rinishida taqqoslang.',
      groupId: group.id,
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      maxScore: 100,
    },
    user: teacherAuthUser,
    files: [],
  };
  const hwRes = createMockRes();
  await createHomework(hwReq, hwRes, next);
  console.log('Homework created status:', hwRes.statusCode, 'Success:', hwRes.body?.success);
  const hw = hwRes.body.data;
  const homeworkId = hw._id || hw.id;

  // 2. Student submits Homework
  console.log('[2] Student submits Homework...');
  const subReq = {
    params: { homeworkId },
    body: {
      answerText: 'O\'simlik hujayrasida hujayra devori, vakuola va xloroplastlar mavjud. Hayvon hujayrasida esa bular yo\'q, lekin sentriolalar bor.',
    },
    user: studentAuthUser,
    files: [],
  };
  const subRes = createMockRes();
  await submitHomework(subReq, subRes, next);
  console.log('Submission status:', subRes.statusCode, 'Success:', subRes.body?.success);
  const sub = subRes.body.data;
  const submissionId = sub._id || sub.id;

  // 3. Teacher views Submissions
  console.log('[3] Teacher retrieves Submissions...');
  const getSubReq = {
    params: { homeworkId },
    user: teacherAuthUser,
  };
  const getSubRes = createMockRes();
  await getSubmissions(getSubReq, getSubRes, next);
  console.log('Get Submissions count:', getSubRes.body?.data?.length);

  // 4. Teacher grades Submission
  console.log('[4] Teacher grades Submission...');
  const gradeReq = {
    params: { id: submissionId },
    body: {
      score: 95,
      feedback: 'Ajoyib, barcha asosiy farqlar aniq ko\'rsatilgan!',
    },
    user: teacherAuthUser,
  };
  const gradeRes = createMockRes();
  await gradeSubmission(gradeReq, gradeRes, next);
  console.log('Grading status:', gradeRes.statusCode, 'Success:', gradeRes.body?.success);
  console.log('Graded submission finalScore:', gradeRes.body?.data?.finalScore);

  // 5. Teacher checks attendance history
  console.log('[5] Teacher checks Attendance for group...');
  const attHistReq = {
    params: { groupId: group.id },
    query: {},
    user: teacherAuthUser,
  };
  const attHistRes = createMockRes();
  await getAttendanceByGroup(attHistReq, attHistRes, next);
  console.log('Attendance records count:', attHistRes.body?.data?.length);

  console.log('\n=== ALL EXTENDED LIFECYCLE CHECKS PASSED ===');
}

testFullLifecycle()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Lifecycle test error:', err);
    process.exit(1);
  });
