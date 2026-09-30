const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { centerWhere } = require('../utils/centerScope');

const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user.userId;
    const [user, results, submissions, attendance] = await Promise.all([
      prisma.user.findFirst({ where: { id: studentId, ...centerWhere(req) }, select: { id: true, name: true, xp: true, coins: true, level: true, streakCurrent: true, streakLongest: true, achievements: true } }),
      prisma.result.findMany({ where: { studentId, ...centerWhere(req) }, orderBy: { completedAt: 'desc' }, take: 20, include: { test: { select: { id: true, title: true } } } }),
      prisma.submission.findMany({ where: { studentId, ...centerWhere(req) }, include: { homework: { select: { id: true, title: true, maxScore: true } } } }),
      prisma.attendance.findMany({ where: { records: { path: ['$[*].studentId'], array_contains: studentId }, ...centerWhere(req) }, take: 30 }),
    ]);

    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
    const passRate = results.length ? Math.round(results.filter(r => r.passed).length / results.length * 100) : 0;
    const submittedHW = submissions.filter(s => s.status !== 'pending').length;
    const gradedHW = submissions.filter(s => s.finalScore != null);
    const avgHWScore = gradedHW.length ? Math.round(gradedHW.reduce((s, sub) => s + (sub.finalScore || 0), 0) / gradedHW.length) : 0;

    return success(res, { user, results, submissions, avgScore, passRate, submittedHW, avgHWScore, totalTests: results.length });
  } catch (err) { next(err); }
};

const getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user.userId;
    const [groups, lessons, tests] = await Promise.all([
      prisma.group.findMany({ where: { teacherId, ...centerWhere(req) }, include: { _count: { select: { students: true } } } }),
      prisma.lesson.findMany({ where: { teacherId, ...centerWhere(req) }, select: { id: true, views: true } }),
      prisma.test.findMany({ where: { teacherId, ...centerWhere(req) }, include: { results: { select: { percentage: true, passed: true } } } }),
    ]);

    const totalStudents = groups.reduce((s, g) => s + g._count.students, 0);
    const totalViews = lessons.reduce((s, l) => s + l.views, 0);
    const allResults = tests.flatMap(t => t.results);
    const avgScore = allResults.length ? Math.round(allResults.reduce((s, r) => s + r.percentage, 0) / allResults.length) : 0;

    return success(res, { groups, totalStudents, totalLessons: lessons.length, totalViews, avgScore, totalTests: tests.length });
  } catch (err) { next(err); }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { groupId: true } });
    const where = { role: 'student', isActive: true, ...centerWhere(req) };
    if (user?.groupId) where.groupId = user.groupId;

    const leaders = await prisma.user.findMany({
      where, orderBy: { xp: 'desc' }, take: 50,
      select: { id: true, name: true, username: true, xp: true, level: true, coins: true, streakCurrent: true, groupId: true },
    });

    return success(res, leaders.map((u, i) => ({ ...u, rank: i + 1 })));
  } catch (err) { next(err); }
};

const recordGameActivity = async (req, res, next) => {
  try {
    const studentId = req.user.userId;
    const { topicTitle, gameType, score = 0, opponentName, isWon, moves, duration, mode = 'solo' } = req.body;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        group: { select: { id: true, name: true, teacherId: true } },
        teacher: { select: { id: true } }
      }
    });

    if (!student) return error(res, 'Student not found', 404);

    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId,
      studentName: student.name,
      groupName: student.group?.name || 'Guruhsiz',
      topicTitle: topicTitle || 'Umumiy mavzu',
      gameType: gameType || 'matchPairs',
      mode: mode || (opponentName ? 'duel' : 'solo'),
      score: Number(score) || 0,
      opponentName: opponentName || null,
      isWon: isWon === true,
      moves: Number(moves) || 0,
      duration: Number(duration) || 0,
      createdAt: new Date().toISOString()
    };

    let existingAchievements = [];
    try {
      existingAchievements = Array.isArray(student.achievements)
        ? student.achievements
        : JSON.parse(student.achievements || '[]');
    } catch (_) {
      existingAchievements = [];
    }

    const updatedAchievements = [newActivity, ...existingAchievements].slice(0, 50);

    const xpGained = Math.max(10, Math.round(Number(score) / 2));
    const coinsGained = 15;

    await prisma.user.update({
      where: { id: studentId },
      data: {
        achievements: updatedAchievements,
        xp: { increment: xpGained },
        coins: { increment: coinsGained }
      }
    });

    // O'qituvchiga bildirishnoma yaratish
    const teacherId = student.group?.teacherId || student.teacherId;
    if (teacherId) {
      const notifTitle = mode === 'duel'
        ? `Guruhdoshlar dueli: ${student.name}`
        : `O'quvchi mavzuni o'yin orqali o'rgandi: ${student.name}`;

      const notifMessage = mode === 'duel'
        ? `${student.name} "${topicTitle}" mavzusida ${opponentName || 'guruhdoshi'} bilan bellashdi (${isWon ? "G'alaba" : "2-o'rin"}, ${score} ball).`
        : `${student.name} "${topicTitle}" mavzusi bo'yicha ${gameType} o'yinini yakunlab ${score} ball to'pladi.`;

      await prisma.notification.create({
        data: {
          userId: teacherId,
          type: 'challenge',
          title: notifTitle,
          message: notifMessage,
          link: '/teacher/analytics',
          centerId: student.centerId || req.user.centerId || null
        }
      }).catch(() => {});
    }

    return success(res, {
      message: 'O\'yin faolligi muvaffaqiyatli saqlandi',
      activity: newActivity,
      xpGained,
      coinsGained
    });
  } catch (err) {
    next(err);
  }
};

const getTeacherGameActivities = async (req, res, next) => {
  try {
    const teacherId = req.user.userId;

    // O'qituvchining guruhlari va talabalari
    const groups = await prisma.group.findMany({
      where: { teacherId, ...centerWhere(req) },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            xp: true,
            coins: true,
            achievements: true,
            groupId: true
          }
        }
      }
    });

    const allStudents = groups.flatMap(g => g.students.map(s => ({ ...s, groupName: g.name })));

    let allActivities = [];
    allStudents.forEach(st => {
      let acts = [];
      try {
        acts = Array.isArray(st.achievements) ? st.achievements : JSON.parse(st.achievements || '[]');
      } catch (_) {}
      acts.forEach(a => {
        if (a && a.topicTitle) {
          allActivities.push({
            ...a,
            studentId: st.id,
            studentName: st.name,
            groupName: st.groupName
          });
        }
      });
    });

    allActivities.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalGames = allActivities.length;
    const totalDuels = allActivities.filter(a => a.mode === 'duel').length;
    const avgScore = totalGames > 0
      ? Math.round(allActivities.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / totalGames)
      : 0;

    const studentStatsMap = {};
    allStudents.forEach(st => {
      studentStatsMap[st.id] = {
        id: st.id,
        name: st.name,
        groupName: st.groupName,
        gamesCount: 0,
        duelsWon: 0,
        totalGameScore: 0,
        xp: st.xp
      };
    });

    allActivities.forEach(a => {
      if (studentStatsMap[a.studentId]) {
        studentStatsMap[a.studentId].gamesCount++;
        studentStatsMap[a.studentId].totalGameScore += Number(a.score) || 0;
        if (a.isWon) studentStatsMap[a.studentId].duelsWon++;
      }
    });

    const topLearners = Object.values(studentStatsMap)
      .sort((a, b) => b.totalGameScore - a.totalGameScore)
      .slice(0, 15);

    return success(res, {
      summary: {
        totalGames,
        totalDuels,
        avgScore,
        totalStudents: allStudents.length
      },
      recentActivities: allActivities.slice(0, 40),
      topLearners
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentAnalytics,
  getTeacherAnalytics,
  getLeaderboard,
  recordGameActivity,
  getTeacherGameActivities
};
