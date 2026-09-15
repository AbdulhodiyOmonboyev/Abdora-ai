const { prisma } = require('../config/db');
const { success } = require('../utils/apiResponse');

const DAY_MAP = {
  mon: 0, monday: 0, du: 0, dushanba: 0, '0': 0, '1': 0,
  tue: 1, tuesday: 1, se: 1, seshanba: 1, '1': 1, '2': 1,
  wed: 2, wednesday: 2, ch: 2, chorshanba: 2, '2': 2, '3': 2,
  thu: 3, thursday: 3, pa: 3, payshanba: 3, '3': 3, '4': 3,
  fri: 4, friday: 4, ju: 4, juma: 4, '4': 4, '5': 4,
  sat: 5, saturday: 5, sha: 5, shanba: 5, '5': 5, '6': 5,
  sun: 6, sunday: 6, yak: 6, yakshanba: 6, '6': 6, '7': 6,
};

function parseDay(d) {
  if (typeof d === 'number' && d >= 0 && d <= 6) return d;
  const str = String(d).toLowerCase().trim();
  return DAY_MAP[str] !== undefined ? DAY_MAP[str] : null;
}

const getSchedule = async (req, res, next) => {
  try {
    const { branchId, roomId, teacherId } = req.query;

    const where = {
      isActive: true,
      ...(req.user.role !== 'admin' && req.user.centerId ? { centerId: req.user.centerId } : {}),
    };

    if (branchId) where.branchId = branchId;
    if (roomId) where.roomId = roomId;
    if (teacherId) where.teacherId = teacherId;

    const groups = await prisma.group.findMany({
      where,
      include: {
        teacher: { select: { id: true, name: true } },
        roomRel: { select: { id: true, name: true, color: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    const slots = [];

    groups.forEach((g) => {
      if (!g.startTime || !g.endTime) return;

      let days = [];
      if (typeof g.weekDays === 'string') {
        try {
          days = JSON.parse(g.weekDays);
        } catch {
          days = g.weekDays.split(',').map((s) => s.trim());
        }
      } else if (Array.isArray(g.weekDays)) {
        days = g.weekDays;
      }

      if (!days || !days.length) {
        // Default to Mon, Wed, Fri if not specified
        days = [0, 2, 4];
      }

      days.forEach((rawDay) => {
        const dayOfWeek = parseDay(rawDay);
        if (dayOfWeek === null) return;

        slots.push({
          id: `${g.id}-${dayOfWeek}`,
          groupId: g.id,
          groupName: g.name,
          teacherId: g.teacherId,
          teacherName: g.teacher?.name || 'O\'qituvchi',
          roomId: g.roomId || g.roomRel?.id || null,
          roomName: g.roomRel?.name || g.room || 'Xona belgilanmagan',
          dayOfWeek,
          startTime: g.startTime,
          endTime: g.endTime,
          color: g.color || g.roomRel?.color || '#3B82F6',
        });
      });
    });

    return success(res, slots);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchedule,
};
