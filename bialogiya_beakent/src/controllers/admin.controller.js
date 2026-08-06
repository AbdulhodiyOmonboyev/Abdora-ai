const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword, getPhoneCode } = require('../utils/generateCredentials');

// Reception accounts should only ever see their OWN branches' data (admin
// sees everything) - see utils/branchScope.js.
const { getOwnBranchIds } = require('../utils/branchScope');

const getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const branchIds = await getOwnBranchIds(req.user);
    // Reception's view is scoped to their own branches; admin sees everything.
    const teacherScope = branchIds ? { branchId: { in: branchIds } } : {};
    const groupScope = branchIds ? { branchId: { in: branchIds } } : {};
    const studentScope = branchIds ? { group: { branchId: { in: branchIds } } } : {};
    const lessonScope = branchIds ? { group: { branchId: { in: branchIds } } } : {};
    const recentUserScope = branchIds
      ? { OR: [{ role: 'teacher', branchId: { in: branchIds } }, { role: 'student', group: { branchId: { in: branchIds } } }] }
      : {};

    const [totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'teacher', isActive: true, ...teacherScope } }),
      prisma.user.count({ where: { role: 'student', isActive: true, ...studentScope } }),
      prisma.group.count({ where: { isActive: true, ...groupScope } }),
      prisma.lesson.count({ where: { isActive: true, ...lessonScope } }),
      branchIds
        ? prisma.user.count({ where: { lastLogin: { gte: today }, ...recentUserScope } })
        : prisma.user.count({ where: { lastLogin: { gte: today } } }),
      branchIds
        ? prisma.user.count({ where: { createdAt: { gte: weekAgo }, ...recentUserScope } })
        : prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      branchIds
        ? prisma.user.findMany({ where: recentUserScope, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, role: true, createdAt: true, isActive: true } })
        : prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, role: true, createdAt: true, isActive: true } }),
    ]);

    return success(res, { totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers });
  } catch (err) { next(err); }
};

const getTeachers = async (req, res, next) => {
  try {
    const { branchId, showInactive } = req.query;
    const ownBranchIds = await getOwnBranchIds(req.user);
    if (ownBranchIds && branchId && !ownBranchIds.includes(branchId)) return error(res, 'Forbidden', 403);
    const branchFilter = branchId ? { branchId } : ownBranchIds ? { branchId: { in: ownBranchIds } } : {};
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher', ...(!showInactive && { isActive: true }), ...branchFilter },
      select: {
        id: true, name: true, username: true, email: true, phone: true,
        isActive: true, createdAt: true, lastLogin: true,
        branch: { select: { id: true, name: true } },
        _count: { select: { taughtGroups: true, students: true, lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, teachers);
  } catch (err) { next(err); }
};

// Reception can only assign a teacher to one of their own branches; admin
// can use any branch. Same rule as group.controller.js's createGroup.
const assertBranchAccess = async (branchId, user) => {
  if (!branchId) return null;
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return 'Branch not found';
  if (user.role === 'reception' && branch.receptionId !== user.userId) return 'Forbidden: not your branch';
  return null;
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, language, branchId, password } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const branchErr = await assertBranchAccess(branchId, req.user);
    if (branchErr) return error(res, branchErr, branchErr.startsWith('Forbidden') ? 403 : 404);

    const code = password?.trim() || getPhoneCode(phone);
    if (!code || code.length < 4) return error(res, 'Phone must include at least 4 digits or provide a valid code', 400);

    const username = generateUsername(name, phone);
    const passwordHash = await bcrypt.hash(code, 10);

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, username, passwordHash, role: 'teacher', language: language || 'uz', branchId: branchId || null },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true, createdAt: true, branch: { select: { id: true, name: true } } },
    });

    return success(res, { user, credentials: { username, password: code } }, 'Teacher created', 201);
  } catch (err) { next(err); }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { name, phone, email, branchId } = req.body;
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'Teacher not found', 404);

    if (req.user.role === 'reception') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (!teacher.branchId || !ownBranchIds.includes(teacher.branchId)) return error(res, 'Forbidden', 403);
    }

    if (branchId !== undefined && branchId !== null) {
      const branchErr = await assertBranchAccess(branchId, req.user);
      if (branchErr) return error(res, branchErr, branchErr.startsWith('Forbidden') ? 403 : 404);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }), phone: phone ?? teacher.phone, ...(email !== undefined && { email }),
        ...(branchId !== undefined && { branchId: branchId || null }),
      },
      select: { id: true, name: true, username: true, email: true, phone: true, isActive: true, branch: { select: { id: true, name: true } } },
    });
    return success(res, updated, 'Teacher updated');
  } catch (err) { next(err); }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'Teacher not found', 404);

    if (req.user.role === 'reception') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (!teacher.branchId || !ownBranchIds.includes(teacher.branchId)) return error(res, 'Forbidden', 403);
    }

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Teacher deactivated');
  } catch (err) { next(err); }
};

// Reception accounts can only be created by admin - there is no self-registration
// and reception users cannot create other reception users.
const getReceptionUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'reception' },
      select: { id: true, name: true, username: true, email: true, phone: true, isActive: true, maxBranches: true, createdAt: true, lastLogin: true,
        _count: { select: { branches: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, users);
  } catch (err) { next(err); }
};

const createReceptionUser = async (req, res, next) => {
  try {
    const { name, email, phone, language, maxBranches, password } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const code = password?.trim() || getPhoneCode(phone);
    if (!code || code.length < 4) return error(res, 'Phone must include at least 4 digits or provide a valid code', 400);

    const username = generateUsername(name, phone);
    const passwordHash = await bcrypt.hash(code, 10);

    const user = await prisma.user.create({
      data: {
        name, email, phone: phone || null, username, passwordHash, role: 'reception', language: language || 'uz',
        maxBranches: Number.isFinite(Number(maxBranches)) && Number(maxBranches) > 0 ? Number(maxBranches) : 3,
      },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true, maxBranches: true, createdAt: true },
    });

    return success(res, { user, credentials: { username, password: code } }, 'Reception user created', 201);
  } catch (err) { next(err); }
};

// PUT /admin/reception/:id - admin can change how many branches a reception
// account is allowed to open (or their other basic details).
const updateReceptionUser = async (req, res, next) => {
  try {
    const { name, phone, email, maxBranches } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }), ...(phone !== undefined && { phone }), ...(email !== undefined && { email }),
        ...(maxBranches !== undefined && Number(maxBranches) > 0 && { maxBranches: Number(maxBranches) }),
      },
      select: { id: true, name: true, username: true, email: true, phone: true, maxBranches: true, isActive: true },
    });
    return success(res, updated, 'Reception user updated');
  } catch (err) { next(err); }
};

const deleteReceptionUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Reception user deactivated');
  } catch (err) { next(err); }
};

const getStudents = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const ownBranchIds = await getOwnBranchIds(req.user);
    if (ownBranchIds && branchId && !ownBranchIds.includes(branchId)) return error(res, 'Forbidden', 403);
    const effectiveBranchId = branchId || null;
    const groupBranchFilter = effectiveBranchId
      ? { branchId: effectiveBranchId }
      : ownBranchIds ? { branchId: { in: ownBranchIds } } : null;
    const students = await prisma.user.findMany({
      where: { role: 'student', isActive: true, ...(groupBranchFilter && { group: groupBranchFilter }) },
      select: { id: true, name: true, username: true, xp: true, level: true, isActive: true, createdAt: true,
        group: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } }, teacher: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, students);
  } catch (err) { next(err); }
};

const getGroups = async (req, res, next) => {
  try {
    const ownBranchIds = await getOwnBranchIds(req.user);
    const groups = await prisma.group.findMany({
      where: ownBranchIds ? { branchId: { in: ownBranchIds } } : {},
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { students: true, lessons: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true, isActive: true, branchId: true, group: { select: { branchId: true } } },
    });
    if (!user) return error(res, 'User not found', 404);

    if (req.user.role === 'reception') {
      // Reception may only toggle teachers/students inside their own branches -
      // never admins, other reception accounts, or anyone outside their scope.
      if (user.role !== 'teacher' && user.role !== 'student') return error(res, 'Forbidden', 403);
      const ownBranchIds = await getOwnBranchIds(req.user);
      const targetBranchId = user.role === 'teacher' ? user.branchId : user.group?.branchId;
      if (!targetBranchId || !ownBranchIds.includes(targetBranchId)) return error(res, 'Forbidden', 403);
    }

    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    return success(res, { isActive: updated.isActive });
  } catch (err) { next(err); }
};

const getSettings = async (_req, res, next) => {
  try {
    return success(res, { maxFileSize: 50, aiModel: 'gpt-4o', language: 'uz', maintenance: false, registrationOpen: false });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try { return success(res, req.body, 'Settings updated'); }
  catch (err) { next(err); }
};

// One-stop overview for a specific teacher: their groups, students (across
// all their groups), and lessons (with which group each belongs to) - used
// when reception clicks the Guruh/O'quvchi/Dars counters on a teacher card.
const getTeacherOverview = async (req, res, next) => {
  try {
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, role: true, branchId: true } });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'Teacher not found', 404);

    if (req.user.role === 'reception') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (!teacher.branchId || !ownBranchIds.includes(teacher.branchId)) return error(res, 'Forbidden', 403);
    }

    const groups = await prisma.group.findMany({
      where: { teacherId: teacher.id },
      select: { id: true, name: true, subject: true, monthlyFee: true, _count: { select: { students: true } }, branch: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });

    const students = await prisma.user.findMany({
      where: { role: 'student', isActive: true, teacherId: teacher.id },
      select: { id: true, name: true, username: true, phone: true, xp: true, level: true, group: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });

    const lessons = await prisma.lesson.findMany({
      where: { teacherId: teacher.id, isActive: true },
      select: { id: true, title: true, subject: true, createdAt: true, group: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, { teacher, groups, students, lessons });
  } catch (err) { next(err); }
};

module.exports = {
  getStats, getTeachers, createTeacher, updateTeacher, deleteTeacher, getStudents, getGroups, toggleUserStatus, getSettings, updateSettings,
  getReceptionUsers, createReceptionUser, updateReceptionUser, deleteReceptionUser, getTeacherOverview,
};
