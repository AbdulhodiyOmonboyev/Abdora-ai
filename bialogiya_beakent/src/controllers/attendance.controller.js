const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { assertGroupAccess } = require('../utils/branchScope');
const { sendCenterSMS } = require('../utils/smsProvider');

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

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const existingAttendance = await prisma.attendance.findUnique({
      where: { groupId_date: { groupId, date: dateObj } },
    });

    const existingRecordsMap = new Map();
    if (existingAttendance && Array.isArray(existingAttendance.records)) {
      for (const rec of existingAttendance.records) {
        if (rec && rec.studentId) {
          existingRecordsMap.set(rec.studentId, rec);
        }
      }
    }

    const calculateDelta = (status, grade, settings) => {
      let delta = 0;
      let reason = '';

      if (status === 'absent') {
        if (settings.coinDeductionEnabled && settings.deductCoinsOnAbsent > 0) {
          delta = -Math.abs(settings.deductCoinsOnAbsent);
          reason = `Davomat: Darsda qatnashmadi (-${Math.abs(delta)} tanga)`;
        }
      } else if (grade !== null && grade !== undefined) {
        if (settings.coinsPerGrade && settings.coinsPerGrade[grade] !== undefined) {
          const configuredDelta = settings.coinsPerGrade[grade];
          if (configuredDelta < 0) {
            delta = settings.coinDeductionEnabled ? configuredDelta : 0;
          } else {
            delta = configuredDelta;
          }
        } else if (grade >= settings.highGradeThreshold) {
          delta = Math.abs(settings.awardCoinsOnHighGrade);
        } else if (grade <= settings.lowGradeThreshold) {
          delta = settings.coinDeductionEnabled ? -Math.abs(settings.deductCoinsOnLowGrade) : 0;
        }

        if (delta > 0) {
          reason = `Darsdagi a'lo baho (${grade}/10): +${delta} tanga`;
        } else if (delta < 0) {
          reason = `Darsdagi past baho (${grade}/10): ${delta} tanga`;
        }
      }

      return { delta, reason };
    };

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

      const existingRecord = existingRecordsMap.get(r.studentId);
      let coinDelta = 0;
      let reason = '';

      if (existingRecord) {
        const statusChanged = existingRecord.status !== status;
        const oldGrade = existingRecord.grade !== undefined && existingRecord.grade !== null && existingRecord.grade !== ''
          ? parseInt(existingRecord.grade, 10)
          : null;
        const parsedOldGrade = isNaN(oldGrade) ? null : oldGrade;
        const gradeChanged = parsedOldGrade !== grade;

        if (!statusChanged && !gradeChanged) {
          // Status va baho o'zgarmagan bo'lsa tangalarga teginmaslik
          coinDelta = 0;
        } else {
          // Faqat o'zgargandagina farqni hisoblash
          const oldCalc = calculateDelta(existingRecord.status, parsedOldGrade, gradeSettings);
          const newCalc = calculateDelta(status, grade, gradeSettings);
          coinDelta = newCalc.delta - oldCalc.delta;

          if (coinDelta > 0) {
            reason = statusChanged
              ? `Davomat yangilandi (${status}): +${coinDelta} tanga`
              : `Baho yangilandi (${grade}/10): +${coinDelta} tanga`;
          } else if (coinDelta < 0) {
            reason = statusChanged
              ? `Davomat yangilandi (${status}): ${coinDelta} tanga`
              : `Baho yangilandi (${grade}/10): ${coinDelta} tanga`;
          }
        }
      } else {
        // Yangi davomat yozuvi
        const newCalc = calculateDelta(status, grade, gradeSettings);
        coinDelta = newCalc.delta;
        reason = newCalc.reason;
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

    // Baholangan, lekin tanga o'zgarmagan o'quvchilarga ham bildirishnoma (faqat yangi yoki bahosi o'zgargan bo'lsa)
    for (const r of cleanedRecords) {
      const existingRec = existingRecordsMap.get(r.studentId);
      const isNewOrChanged = !existingRec || (existingRec.grade ?? null) !== (r.grade ?? null);
      if (r.grade !== null && isNewOrChanged && !coinUpdates.some(u => u.studentId === r.studentId)) {
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

    // Darsda qatnashmagan (absent) o'quvchilar ota-onasiga SMS xabar jo'natish (faqat yangi absent bo'lsa)
    const absentRecords = cleanedRecords.filter(r => {
      const ex = existingRecordsMap.get(r.studentId);
      return r.status === 'absent' && (!ex || ex.status !== 'absent');
    });
    if (absentRecords.length > 0 && group?.centerId) {
      const absentStudentIds = absentRecords.map(r => r.studentId);
      prisma.user.findMany({
        where: { id: { in: absentStudentIds }, parentPhone: { not: null } },
        select: { id: true, name: true, parentPhone: true, parentName: true }
      }).then(studentsWithParents => {
        for (const s of studentsWithParents) {
          if (!s.parentPhone) continue;
          const msg = `Hurmatli ota-ona! Farzandingiz ${s.name} bugun ${group.name} guruhidagi darsda qatnashmadi.`;
          sendCenterSMS({
            centerId: group.centerId,
            toPhone: s.parentPhone,
            message: msg,
            trigger: 'attendance_missed',
            recipientType: 'parent',
            userId: s.id
          }).catch(() => {});
        }
      }).catch(() => {});
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
