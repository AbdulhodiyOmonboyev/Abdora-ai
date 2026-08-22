const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { getOwnBranchIds } = require('../utils/branchScope');

// Reception may only touch groups that belong to one of their own branches
// (a group with no branch at all is admin-only territory). Returns an error
// object {message, status} or null if access is fine.
const assertGroupAccess = async (groupId, user) => {
  if (user.role === 'admin') return null;
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { branchId: true } });
  if (!group) return { message: 'Guruh topilmadi', status: 404 };
  if (!group.branchId) return { message: "Ruxsat yo'q", status: 403 };
  if (user.role === 'teacher') {
    const owned = await prisma.group.findFirst({ where: { id: groupId, teacherId: user.userId }, select: { id: true } });
    if (!owned) return { message: "Ruxsat yo'q", status: 403 };
  } else {
    const ownBranchIds = await getOwnBranchIds(user);
    if (!ownBranchIds?.includes(group.branchId)) return { message: "Ruxsat yo'q", status: 403 };
  }
  return null;
};

const createGroup = async (req, res, next) => {
  try {
    let { name, description, subject, icon, color, teacherId, branchId, monthlyFee,
            weekDays, startTime, endTime, room, totalLessons, level, startDate } = req.body;
    if (!name) return error(res, 'Group name required', 400);

    const assignedTeacherId = req.user.role === 'teacher' ? req.user.userId : teacherId;
    if (!assignedTeacherId) return error(res, 'teacherId required', 400);

    const ownBranchIds = await getOwnBranchIds(req.user);
    if (ownBranchIds) {
      if (!branchId && ownBranchIds.length > 0) branchId = ownBranchIds[0];
      if (branchId && !ownBranchIds.includes(branchId)) {
        return error(res, 'Forbidden: not your branch', 403);
      }
    }

    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) return error(res, 'Branch not found', 404);
    }
    const teacher = await prisma.user.findFirst({ where: { id: assignedTeacherId, role: 'teacher' }, select: { id: true, branchId: true } });
    if (!teacher) return error(res, 'Teacher not found', 404);
    if (ownBranchIds && teacher.branchId && !ownBranchIds.includes(teacher.branchId)) return error(res, 'Forbidden', 403);

    if (teacher && !teacher.branchId && branchId) {
      await prisma.user.update({ where: { id: teacher.id }, data: { branchId } });
    }

    const group = await prisma.group.create({
      data: {
        name, description, subject: subject || 'other', icon, color,
        teacherId: assignedTeacherId,
        branchId: branchId || null,
        monthlyFee: monthlyFee ? parseInt(monthlyFee, 10) : null,
        weekDays: weekDays ? JSON.stringify(weekDays) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        room: room || null,
        totalLessons: totalLessons ? parseInt(totalLessons, 10) : null,
        level: level || null,
        startDate: startDate ? new Date(startDate) : null,
      },
      include: {
        teacher: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });
    return success(res, group, 'Group created', 201);
  } catch (err) { next(err); }
};

const getMyGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { teacherId: req.user.userId, isActive: true },
      include: { students: { select: { id: true, name: true, username: true } }, _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const getAllGroups = async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'teacher') where = { teacherId: req.user.userId };
    else if (req.user.role === 'reception') where = { branch: { receptionId: req.user.userId } };
    const groups = await prisma.group.findMany({
      where: { ...where, isActive: true },
      include: { teacher: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } }, students: { select: { id: true, name: true } } },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

// How far through the course a group is. An Attendance row is created once per
// lesson actually held, so counting them is the truthful measure of progress -
// more so than counting Lesson rows, which a teacher may create in advance.
const buildProgress = async (group) => {
  const [lessonsHeld, lessonsCreated, lastSession] = await Promise.all([
    prisma.attendance.count({ where: { groupId: group.id } }),
    prisma.lesson.count({ where: { groupId: group.id, isActive: true } }),
    prisma.attendance.findFirst({ where: { groupId: group.id }, orderBy: { date: 'desc' }, select: { date: true } }),
  ]);

  const total = group.totalLessons || null;
  const percent = total && total > 0 ? Math.min(100, Math.round((lessonsHeld / total) * 100)) : null;

  return {
    lessonsHeld,
    lessonsCreated,
    totalLessons: total,
    percent,
    remaining: total ? Math.max(0, total - lessonsHeld) : null,
    lastSessionAt: lastSession?.date || null,
    // Plain-language answer to "can I still put a new student in this group?"
    label: percent === null
      ? 'Kurs davomiyligi kiritilmagan'
      : percent >= 70 ? 'Kurs oxirlab qoldi — yangi o\'quvchi qiynaladi'
        : percent >= 40 ? 'Kurs yarmiga yetdi'
          : 'Kurs boshida — yangi o\'quvchi qo\'shsa bo\'ladi',
  };
};

const getGroupById = async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { id: true, name: true, phone: true } },
        branch: { select: { id: true, name: true } },
        students: {
          where: { isActive: true },
          select: { id: true, name: true, username: true, xp: true, level: true, isFrozen: true, lastLogin: true, phone: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { students: true } },
      },
    });
    if (!group) return error(res, 'Guruh topilmadi', 404);
    const accessErr = await assertGroupAccess(req.params.id, req.user);
    if (accessErr) return error(res, accessErr.message, accessErr.status);

    const progress = await buildProgress(group);

    return success(res, {
      ...group,
      // weekDays is stored as a JSON string; hand the client a real array.
      weekDays: group.weekDays ? JSON.parse(group.weekDays) : [],
      progress,
    });
  } catch (err) { next(err); }
};

const updateGroup = async (req, res, next) => {
  try {
    const accessErr = await assertGroupAccess(req.params.id, req.user);
    if (accessErr) return error(res, accessErr.message, accessErr.status);

    const { name, description, subject, icon, color, isActive, teacherId, branchId,
            monthlyFee, weekDays, startTime, endTime, room, totalLessons, level, startDate } = req.body;

    // If reception is reassigning the group to a different branch, that
    // branch must also be one of theirs.
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (!branch || (ownBranchIds && !ownBranchIds.includes(branchId))) return error(res, 'Forbidden: not your branch', 403);
    }
    if (teacherId && req.user.role !== 'admin') {
      const teacher = await prisma.user.findFirst({ where: { id: teacherId, role: 'teacher' }, select: { branchId: true } });
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (!teacher || (ownBranchIds && !ownBranchIds.includes(teacher.branchId)) || (branchId && teacher.branchId !== branchId)) return error(res, 'Forbidden', 403);
    }

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: {
        name, description, subject, icon, color, isActive,
        ...(teacherId ? { teacherId } : {}),
        ...(branchId !== undefined ? { branchId: branchId || null } : {}),
        ...(monthlyFee !== undefined ? { monthlyFee: monthlyFee ? parseInt(monthlyFee, 10) : null } : {}),
        ...(weekDays !== undefined ? { weekDays: weekDays ? JSON.stringify(weekDays) : null } : {}),
        ...(startTime !== undefined ? { startTime: startTime || null } : {}),
        ...(endTime !== undefined ? { endTime: endTime || null } : {}),
        ...(room !== undefined ? { room: room || null } : {}),
        ...(totalLessons !== undefined ? { totalLessons: totalLessons ? parseInt(totalLessons, 10) : null } : {}),
        ...(level !== undefined ? { level: level || null } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      },
    });
    return success(res, group);
  } catch (err) { next(err); }
};

const deleteGroup = async (req, res, next) => {
  try {
    const accessErr = await assertGroupAccess(req.params.id, req.user);
    if (accessErr) return error(res, accessErr.message, accessErr.status);

    await prisma.group.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Group deleted');
  } catch (err) { next(err); }
};

const addStudentToGroup = async (req, res, next) => {
  try {
    const accessErr = await assertGroupAccess(req.params.id, req.user);
    if (accessErr) return error(res, accessErr.message, accessErr.status);

    const { studentId } = req.body;
    if (!studentId) return error(res, 'studentId required', 400);
    const student = await prisma.user.findFirst({ where: { id: studentId, role: 'student' }, select: { id: true, group: { select: { branchId: true } } } });
    if (!student) return error(res, 'Student not found', 404);
    const group = await prisma.group.findUnique({ where: { id: req.params.id }, select: { branchId: true } });
    if (req.user.role !== 'admin' && student.group?.branchId && student.group.branchId !== group.branchId) return error(res, 'Forbidden', 403);
    await prisma.user.update({ where: { id: studentId }, data: { groupId: req.params.id } });
    return success(res, null, 'Student added');
  } catch (err) { next(err); }
};

const removeStudentFromGroup = async (req, res, next) => {
  try {
    const accessErr = await assertGroupAccess(req.params.id, req.user);
    if (accessErr) return error(res, accessErr.message, accessErr.status);

    const student = await prisma.user.findFirst({ where: { id: req.params.studentId, groupId: req.params.id, role: 'student' }, select: { id: true } });
    if (!student) return error(res, 'Student not found', 404);
    await prisma.user.update({ where: { id: student.id }, data: { groupId: null } });
    return success(res, null, 'Student removed');
  } catch (err) { next(err); }
};

module.exports = { createGroup, getMyGroups, getAllGroups, getGroupById, updateGroup, deleteGroup, addStudentToGroup, removeStudentFromGroup };
