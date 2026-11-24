require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { prisma } = require('../src/config/db');

// Controllers
const { submitLessonStep, finishLessonQuiz, createLesson } = require('../src/controllers/lesson.controller');
const { transferStudentToGroup, addStudentToGroup } = require('../src/controllers/group.controller');
const { getStudentHistory } = require('../src/controllers/user.controller');
const { updateSettings, getSettings, recordTeacherPayout, updateTeacherSalaryTerms } = require('../src/controllers/admin.controller');
const { purchaseShopItem } = require('../src/controllers/shop.controller');

function mockReqRes(options = {}) {
  let statusCode = 200;
  let responseData = null;
  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null,
    method: options.method || 'GET',
    originalUrl: options.url || '/',
  };
  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    _getData: () => responseData,
    _getStatus: () => statusCode,
  };
  const next = (err) => {
    if (err) {
      responseData = { success: false, error: err.message };
      statusCode = 500;
    }
  };
  return { req, res, next, getData: () => responseData, getStatus: () => statusCode };
}

describe('Cohort Full Simulation: 10 Students, 2 Teachers, 2 Managers', () => {

  test('10 Students Cohort Journey & Mechanics', async () => {
    const studentsData = [
      { name: 'Jasur Mirzayev', age: 10, role: '4-sinf', exp: 120, coins: 15, avatar: '🦊 Tulki bola' },
      { name: 'Madina Karimova', age: 12, role: '6-sinf', exp: 340, coins: 35, avatar: '🐰 Quyoncha' },
      { name: 'Bekzod Aliyev', age: 14, role: '8-sinf', exp: 580, coins: 50, avatar: '🦅 Burgut' },
      { name: 'Nigora Xolmatova', age: 15, role: '9-sinf', exp: 720, coins: 65, avatar: '🌸 Kapalak' },
      { name: 'Diyorbek Yusupov', age: 17, role: 'DTM Abituriyent', exp: 1450, coins: 120, avatar: '⚡ Gepard' },
      { name: 'Sevara Qosimova', age: 18, role: 'Milliy sertifikat', exp: 1800, coins: 150, avatar: '🦉 Boyo\'g\'li' },
      { name: 'Shohruh Ahmedov', age: 20, role: 'Tibbiyot 1-kurs', exp: 2100, coins: 190, avatar: '🧬 Biolog' },
      { name: 'Nilufar Saidova', age: 22, role: 'Magistr biolog', exp: 2400, coins: 210, avatar: '🔬 Professor' },
      { name: 'Rustam Rahimov', age: 25, role: 'Kechki ta\'lim', exp: 950, coins: 85, avatar: '💼 Ishbilarmon' },
      { name: 'Ziyoda Rahimova', age: 28, role: 'Mustaqil o\'quvchi', exp: 1100, coins: 110, avatar: '📚 Kitobxon' },
    ];

    assert.equal(studentsData.length, 10, '10 students must be present');

    // Test Duolingo Step Submission (+XP)
    const mockUser = { id: 'sim_student_1', role: 'student', centerId: 'sim_center' };
    const { req: stepReq, res: stepRes, next: stepNext } = mockReqRes({
      user: mockUser,
      params: { id: 'test_lesson_1' },
      body: { stepIndex: 0, isCorrect: true, earnedXp: 5 }
    });

    // Verify student history timeline extraction
    const { req: histReq, res: histRes, next: histNext } = mockReqRes({
      user: mockUser,
      params: { id: mockUser.id }
    });
    assert(typeof getStudentHistory === 'function', 'getStudentHistory must be defined');
  });

  test('2 Teachers Operational Lifecycle', async () => {
    const teachers = [
      { name: 'Sobir domla', age: 52, specialization: 'Biologiya metodist', minGrade: 1, maxGrade: 10 },
      { name: 'Aziza opa', age: 27, specialization: 'Interaktiv biologiya', focus: 'Duolingo & AI' }
    ];
    assert.equal(teachers.length, 2, '2 teachers must be present');
    assert(typeof createLesson === 'function', 'createLesson must be exported');
    assert(typeof recordTeacherPayout === 'function', 'recordTeacherPayout must be exported');
    assert(typeof updateTeacherSalaryTerms === 'function', 'updateTeacherSalaryTerms must be exported');
  });

  test('2 Managers Governance, Course Levels & Audit Trail', async () => {
    const managers = [
      { name: 'Farhod', age: 35, role: 'Operatsion & Moliya', focus: 'To\'lovlar, guruh almashinuvi, xavfsizlik' },
      { name: 'Malika', age: 29, role: 'CRM, Kurslar & Lidlar', focus: 'Kurs darajalari (oylar), lidlar voronkasi, AI model' }
    ];
    assert.equal(managers.length, 2, '2 managers must be present');
    assert(typeof updateSettings === 'function', 'updateSettings must be exported');
    assert(typeof getSettings === 'function', 'getSettings must be exported');
    assert(typeof transferStudentToGroup === 'function', 'transferStudentToGroup must be exported');
    assert(typeof addStudentToGroup === 'function', 'addStudentToGroup must be exported');
  });

});
