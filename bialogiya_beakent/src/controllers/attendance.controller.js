const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { assertGroupAccess } = require('../utils/branchScope');

const DEFAULT_GRADE_SETTINGS = {
  minGrade: 1,
  maxGrade: 10,
  coinDeductionEnabled: true,      // Coin ayirish imkoniyati yoqilganmi / o'chirilganmi
  deductCoinsOnAbsent: 5,         // Darsga kelmaganda (absent) ayiriladigan tangalar
  deductCoinsOnLowGrade: 3,       // Past baho (1-4) olganda ayiriladigan tangalar
  lowGradeThreshold: 4,           // Past baho chegarasi
  awardCoinsOnHighGrade: 5,       // A'lo baho (8-10) olganda beriladigan tangalar
  highGradeThreshold: 8,          // Yuqori baho chegarasi
  coinsPerGrade: {
    1: -5,
    2: -4,
    3: -3,
    4: -2,
    5: 0,
    6: 1,
    7: 2,
    8: 3,
    9: 4,
    10: 5,
  },
};

const getCenterGradeSettings = async (centerId) => {
  if (!centerId) return DEFAULT_GRADE_SETTINGS;
  try {
    const center = await prisma.center.findUnique({
      where: { id: centerId },
      select: { settings: true },
    });
    const settings = center?.settings && typeof center.settings === 'object' ? center.settings : {};
    return {
      ...DEFAULT_GRADE_SETTINGS,
      ...(settings.gradeSettings || {}),
    };
  } catch (_) {
    return DEFAULT_GRADE_SETTINGS;
  }
};

const markAttendance = async (req, res, next) => {
  try {
    const { groupId, date, records } = req.body;
    if (!groupId || !date || !records) return error(res, 'groupId, date and records required', 400);
    const access = await assertGroupAccess(groupId, req.user, prisma);
    if (access.error) return error(res, access.error, access.status);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, centerId: true },
    });

    const activeStudents = await prisma.user.findMany({
      where: { groupId, role: 'student', isActive: true, isFrozen: false },
      select: { id: true, coins: true, xp: true, achievements: true },
    });
    const activeStudentMap = new Map(activeStudents.map(s => [s.id, s]));

    const gradeSettings = await getCenterGradeSettings(group?.centerId || req.user.centerId);

    const cleanedRecords = [];
    const coinUpdates = [];

    for (const r of (Array.isArray(records) ? records : [])) {
      if (!activeStudentMap.has(r.studentId)) continue;

      let grade = null;
      if (r.grade !== undefined && r.grade !== null && r.grade !== '') {
        const parsed = parseInt(r.grade, 10);
        if (!isNaN(parsed)) {
          grade = Math.max(gradeSettings.minGrade, Math.min(gradeSettings.maxGrade, parsed));
        }
      }

      const status = ['present', 'late', 'absent'].includes(r.status) ? r.status : 'present';
      const note = typeof r.note === 'string' ? r.note.trim() : '';

      cleanedRecords.push({
        studentId: r.studentId,
        status,
        grade,
        note,
      });

      // Tangalarni hisoblash (Sozlamalar asosida ayirish yoki qo'shish)
      let coinDelta = 0;
      let reason = '';

      if (status === 'absent') {
        if (gradeSettings.coinDeductionEnabled && gradeSettings.deductCoinsOnAbsent > 0) {
          coinDelta = -Math.abs(gradeSettings.deductCoinsOnAbsent);
          reason = `Davomat: Darsda qatnashmadi (-${Math.abs(coinDelta)} tanga)`;
        }
      } else if (grade !== null) {
        if (gradeSettings.coinsPerGrade && gradeSettings.coinsPerGrade[grade] !== undefined) {
          const configuredDelta = gradeSettings.coinsPerGrade[grade];
          if (configuredDelta < 0) {
            coinDelta = gradeSettings.coinDeductionEnabled ? configuredDelta : 0;
          } else {
            coinDelta = configuredDelta;
          }
        } else if (grade >= gradeSettings.highGradeThreshold) {
          coinDelta = Math.abs(gradeSettings.awardCoinsOnHighGrade);
        } else if (grade <= gradeSettings.lowGradeThreshold) {
          coinDelta = gradeSettings.coinDeductionEnabled ? -Math.abs(gradeSettings.deductCoinsOnLowGrade) : 0;
        }

        if (coinDelta > 0) {
          reason = `Darsdagi a'lo baho (${grade}/10): +${coinDelta} tanga`;
        } else if (coinDelta < 0) {
          reason = `Darsdagi past baho (${grade}/10): ${coinDelta} tanga`;
        }
      }

      if (coinDelta !== 0) {
        coinUpdates.push({
          studentId: r.studentId,
          delta: coinDelta,
          reason,
          grade,
          status,
        });
      }
    }

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const att = await prisma.attendance.upsert({
      where: { groupId_date: { groupId, date: dateObj } },
      update: { records: cleanedRecords, teacherId: req.user.userId, centerId: group?.centerId },
      create: { groupId, date: dateObj, records: cleanedRecords, teacherId: req.user.userId, centerId: group?.centerId },
    });

    // O'quvchilar hisobidagi tangalarni yangilash (Xatolik bo'lsa ham davomat saqlanadi)
    for (const updateItem of coinUpdates) {
      try {
        const student = activeStudentMap.get(updateItem.studentId);
        if (!student) continue;

        const currentCoins = student.coins || 0;
        const newCoins = Math.max(0, currentCoins + updateItem.delta);

        const existingAchievements = student.achievements && typeof student.achievements === 'object' && !Array.isArray(student.achievements)
          ? student.achievements
          : { badges: [], notes: [], coinTransactions: [] };

        const coinTransactions = Array.isArray(existingAchievements.coinTransactions)
          ? existingAchievements.coinTransactions
          : [];

        coinTransactions.unshift({
          id: `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: 'attendance_grade',
          title: updateItem.reason,
          coins: updateItem.delta,
          grade: updateItem.grade,
          status: updateItem.status,
          date: new Date().toISOString(),
          authorName: req.user.name || req.user.username || 'O\'qituvchi',
        });

        await prisma.user.update({
          where: { id: updateItem.studentId },
          data: {
            coins: newCoins,
            achievements: {
              ...existingAchievements,
              coinTransactions: coinTransactions.slice(0, 50),
            },
          },
        });

        // O'quvchiga bildirishnoma jo'natish
        await prisma.notification.create({
          data: {
            userId: updateItem.studentId,
            type: updateItem.delta >= 0 ? 'achievement' : 'info',
            title: 'Dars davomati va baho',
            message: updateItem.reason,
            centerId: group?.centerId || null,
          },
        }).catch(() => {});
      } catch (_) {}
    }

    // Baholangan, lekin tanga o'zgarmagan o'quvchilarga ham bildirishnoma
    for (const r of cleanedRecords) {
      if (r.grade !== null && !coinUpdates.some(u => u.studentId === r.studentId)) {
        await prisma.notification.create({
          data: {
            userId: r.studentId,
            type: 'info',
            title: 'Darsdagi bahoyingiz',
            message: `Davomat belgilandi. Sizga bugungi dars uchun ${r.grade}/10 baho qo'yildi.`,
            centerId: group?.centerId || null,
          },
        }).catch(() => {});
      }
    }

    return success(res, att, 'Davomat va baholar muvaffaqiyatli saqlandi');
  } catch (err) { next(err); }
};

const getAttendanceByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { from, to } = req.query;
    const access = await assertGroupAccess(groupId, req.user, prisma);
    if (access.error) return error(res, access.error, access.status);
    const where = { groupId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const att = await prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
    return success(res, att);
  } catch (err) { next(err); }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { groupId: true } });
    if (!user?.groupId) return success(res, []);
    const att = await prisma.attendance.findMany({
      where: { groupId: user.groupId },
      orderBy: { date: 'desc' },
      take: 30,
    });
    const personal = att.map(a => {
      const recs = Array.isArray(a.records) ? a.records : [];
      const rec = recs.find(r => r.studentId === req.user.userId);
      return {
        date: a.date,
        status: rec?.status || 'absent',
        grade: rec?.grade ?? null,
        note: rec?.note || '',
      };
    });
    return success(res, personal);
  } catch (err) { next(err); }
};

const getAttendanceGradeSettings = async (req, res, next) => {
  try {
    const settings = await getCenterGradeSettings(req.user.centerId);
    return success(res, settings);
  } catch (err) { next(err); }
};

const updateAttendanceGradeSettings = async (req, res, next) => {
  try {
    const centerId = req.user.centerId;
    if (!centerId) {
      return success(res, { ...DEFAULT_GRADE_SETTINGS, ...req.body }, 'Sozlamalar saqlandi');
    }
    const center = await prisma.center.findUnique({ where: { id: centerId }, select: { settings: true } });
    const current = center?.settings && typeof center.settings === 'object' ? center.settings : {};
    const updatedGradeSettings = {
      ...DEFAULT_GRADE_SETTINGS,
      ...(current.gradeSettings || {}),
      ...req.body,
    };
    await prisma.center.update({
      where: { id: centerId },
      data: {
        settings: {
          ...current,
          gradeSettings: updatedGradeSettings,
        },
      },
    });
    return success(res, updatedGradeSettings, 'Baho va coin sozlamalari muvaffaqiyatli saqlandi');
  } catch (err) { next(err); }
};

module.exports = {
  markAttendance,
  getAttendanceByGroup,
  getMyAttendance,
  getAttendanceGradeSettings,
  updateAttendanceGradeSettings,
  DEFAULT_GRADE_SETTINGS,
};
