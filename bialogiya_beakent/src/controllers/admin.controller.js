const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword, getPhoneCode } = require('../utils/generateCredentials');

// Reception accounts should only ever see their OWN branches' data (admin
// sees everything) - see utils/branchScope.js.
const { getOwnBranchIds } = require('../utils/branchScope');
const cache = require('../utils/simpleCache');

const getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const branchIds = await getOwnBranchIds(req.user);

    let teacherScope = {};
    let groupScope = {};
    let studentScope = {};
    let lessonScope = {};
    let recentUserScope = {};

    if (branchIds && branchIds.length > 0) {
      teacherScope = { OR: [{ branchId: { in: branchIds } }, { branchId: null }] };
      groupScope = { OR: [{ branchId: { in: branchIds } }, { branchId: null }] };
      studentScope = { OR: [{ branchId: { in: branchIds } }, { group: { branchId: { in: branchIds } } }, { branchId: null }] };
      lessonScope = { OR: [{ group: { branchId: { in: branchIds } } }, { group: { branchId: null } }] };
      recentUserScope = {
        OR: [
          { role: 'teacher', OR: [{ branchId: { in: branchIds } }, { branchId: null }] },
          { role: 'student', OR: [{ branchId: { in: branchIds } }, { group: { branchId: { in: branchIds } } }, { branchId: null }] }
        ]
      };
    }

    const [totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'teacher', isActive: true, ...teacherScope } }),
      prisma.user.count({ where: { role: 'student', isActive: true, ...studentScope } }),
      prisma.group.count({ where: { isActive: true, ...groupScope } }),
      prisma.lesson.count({ where: { isActive: true, ...lessonScope } }),
      prisma.user.count({ where: { lastLogin: { gte: today }, ...recentUserScope } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo }, ...recentUserScope } }),
      prisma.user.findMany({
        where: recentUserScope,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, name: true, username: true, role: true, createdAt: true, isActive: true }
      }),
    ]);

    return success(res, { totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers });
  } catch (err) { next(err); }
};

const getTeachers = async (req, res, next) => {
  try {
    const { branchId, showInactive } = req.query;
    const ownBranchIds = await getOwnBranchIds(req.user);
    if (ownBranchIds && branchId && !ownBranchIds.includes(branchId)) return error(res, 'Forbidden', 403);

    let branchFilter = {};
    if (branchId) {
      branchFilter = { branchId };
    } else if (ownBranchIds) {
      branchFilter = ownBranchIds.length > 0
        ? { OR: [{ branchId: { in: ownBranchIds } }, { branchId: null }] }
        : {};
    }

    const teachers = await prisma.user.findMany({
      where: { role: 'teacher', ...(!showInactive && { isActive: true }), ...branchFilter },
      select: {
        id: true, name: true, username: true, email: true, phone: true, branchId: true,
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
  if (!branchId) return user.role === 'manager' ? 'Branch is required' : null;
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return 'Branch not found';
  if (user.role === 'reception' && branch.receptionId !== user.userId) return 'Forbidden: not your branch';
  if (user.role === 'manager' && branch.managerId !== user.userId) return 'Forbidden: not your branch';
  return null;
};

const createTeacher = async (req, res, next) => {
  try {
    let { name, email, phone, language, branchId, password } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const ownBranchIds = await getOwnBranchIds(req.user);
    if (!branchId && ownBranchIds && ownBranchIds.length > 0) {
      branchId = ownBranchIds[0];
    }

    const branchErr = await assertBranchAccess(branchId, req.user);
    if (branchErr) return error(res, branchErr, branchErr.startsWith('Forbidden') ? 403 : 404);

    const code = generatePassword(phone, password);
    let username = generateUsername(name, phone);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) username = `${username}${Math.floor(10 + Math.random() * 90)}`;

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
    let { name, phone, email, branchId } = req.body;
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'Teacher not found', 404);

    if (req.user.role === 'reception' || req.user.role === 'manager') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (teacher.branchId && !ownBranchIds.includes(teacher.branchId)) return error(res, 'Forbidden', 403);
      if (!branchId && !teacher.branchId && ownBranchIds && ownBranchIds.length > 0) {
        branchId = ownBranchIds[0];
      }
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

    if (req.user.role === 'reception' || req.user.role === 'manager') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (teacher.branchId && !ownBranchIds.includes(teacher.branchId)) return error(res, 'Forbidden', 403);
    }

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Teacher deactivated');
  } catch (err) { next(err); }
};

// Reception accounts can only be created by admin - there is no self-registration
// and reception users cannot create other reception users.
const getReceptionUsers = async (req, res, next) => {
  try {
    const branchFilter = req.user.role === 'manager'
      ? { branches: { some: { managerId: req.user.userId } } }
      : {};

    const users = await prisma.user.findMany({
      where: { role: 'reception', ...branchFilter },
      select: { id: true, name: true, username: true, email: true, phone: true, isActive: true, maxBranches: true, createdAt: true, lastLogin: true,
        _count: { select: { branches: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, users);
  } catch (err) { next(err); }
};

const createReceptionUser = async (req, res, next) => {
  try {
    const { name, email, phone, language, maxBranches, password, branchId } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const code = generatePassword(phone, password);
    let username = generateUsername(name, phone);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) username = `${username}${Math.floor(10 + Math.random() * 90)}`;

    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) return error(res, 'Branch not found', 404);
      if (branch.receptionId) return error(res, 'Branch already assigned to another reception', 400);
    }

    const passwordHash = await bcrypt.hash(code, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        username,
        passwordHash,
        role: 'reception',
        language: language || 'uz',
        maxBranches: Number.isFinite(Number(maxBranches)) && Number(maxBranches) > 0 ? Number(maxBranches) : 3,
      },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true, maxBranches: true, createdAt: true },
    });

    if (branchId) {
      await prisma.branch.update({
        where: { id: branchId },
        data: { receptionId: user.id },
      });
    }

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
    const { branchId, groupId } = req.query;
    const ownBranchIds = await getOwnBranchIds(req.user);
    if (ownBranchIds && branchId && !ownBranchIds.includes(branchId)) return error(res, 'Forbidden', 403);

    let branchFilter = {};
    if (branchId) {
      branchFilter = { OR: [{ branchId }, { group: { branchId } }] };
    } else if (ownBranchIds) {
      branchFilter = ownBranchIds.length > 0
        ? { OR: [{ branchId: { in: ownBranchIds } }, { group: { branchId: { in: ownBranchIds } } }, { branchId: null }] }
        : {};
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        isActive: true,
        ...(groupId && { groupId }),
        ...branchFilter,
      },
      select: {
        id: true, name: true, username: true, phone: true, xp: true, level: true, isActive: true, createdAt: true,
        group: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } },
        teacher: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
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

// Branch management - admin only
const getBranches = async (req, res, next) => {
  try {
    const cacheKey = `admin_branches_${req.user.userId || 'anon'}`;
    const cached = cache.get(cacheKey);
    if (cached) return success(res, cached);
    const ownBranchIds = await getOwnBranchIds(req.user);
    const branches = await prisma.branch.findMany({
      where: { isActive: true, ...(ownBranchIds ? { id: { in: ownBranchIds } } : {}) },
      include: {
        reception: { select: { id: true, name: true } },
        _count: { select: { groups: true, teachers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, branches);
    // Cache for short period
    cache.set(cacheKey, branches, 5000);
  } catch (err) { next(err); }
};

const createBranch = async (req, res, next) => {
  try {
    const { name, address, receptionId, studentCapacity, latitude, longitude } = req.body;
    if (!name) return error(res, 'Branch name required', 400);

    const branchData = {
      name,
      address: address || null,
      studentCapacity: Number.isFinite(Number(studentCapacity)) ? Number(studentCapacity) : null,
      receptionId: receptionId || null,
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
    };

    if (req.user.role === 'manager') {
      branchData.managerId = req.user.userId;
    }

    const branch = await prisma.branch.create({
      data: branchData,
      include: {
        reception: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        _count: { select: { groups: true, teachers: true } },
      },
    });
    return success(res, branch, 'Branch created', 201);
  } catch (err) { next(err); }
};

const updateBranch = async (req, res, next) => {
  try {
    const { name, address, receptionId, studentCapacity, latitude, longitude } = req.body;
    const branch = await prisma.branch.findUnique({ where: { id: req.params.id } });
    if (!branch) return error(res, 'Branch not found', 404);
    if (req.user.role === 'manager' && branch.managerId !== req.user.userId) return error(res, 'Forbidden', 403);

    const updated = await prisma.branch.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(receptionId !== undefined && { receptionId: receptionId || null }),
        ...(studentCapacity !== undefined && { studentCapacity: Number.isFinite(Number(studentCapacity)) ? Number(studentCapacity) : null }),
        ...(latitude !== undefined && { latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null }),
        ...(longitude !== undefined && { longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null }),
      },
      include: {
        reception: { select: { id: true, name: true } },
        _count: { select: { groups: true, teachers: true } },
      },
    });
    return success(res, updated, 'Branch updated');
  } catch (err) { next(err); }
};

const deleteBranch = async (req, res, next) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.id } });
    if (!branch) return error(res, 'Branch not found', 404);
    if (req.user.role === 'manager' && branch.managerId !== req.user.userId) return error(res, 'Forbidden', 403);

    await prisma.branch.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Branch deleted');
  } catch (err) { next(err); }
};

const getBranchDetail = async (req, res, next) => {
  try {
    const cacheKey = `branch_detail_${req.params.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return success(res, cached);
    const branch = await prisma.branch.findFirst({
      where: { id: req.params.id, isActive: true },
      include: {
        reception: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        teachers: { select: { id: true, name: true, username: true, phone: true, isActive: true } },
        groups: {
          select: {
            id: true,
            name: true,
            subject: true,
            monthlyFee: true,
            weekDays: true,
            startTime: true,
            endTime: true,
            room: true,
            teacher: { select: { id: true, name: true } },
            _count: { select: { students: true } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!branch) return error(res, 'Branch not found', 404);
    if (req.user.role === 'manager' && branch.managerId !== req.user.userId) return error(res, 'Forbidden', 403);

    const studentsCount = await prisma.user.count({
      where: { role: 'student', group: { branchId: branch.id }, isActive: true },
    });

    return success(res, { ...branch, studentsCount });
    cache.set(cacheKey, { ...branch, studentsCount }, 5000);
  } catch (err) { next(err); }
};

module.exports = {
  getStats, getTeachers, createTeacher, updateTeacher, deleteTeacher, getStudents, getGroups, toggleUserStatus, getSettings, updateSettings,
  getReceptionUsers, createReceptionUser, updateReceptionUser, deleteReceptionUser, getTeacherOverview,
  getBranches, createBranch, updateBranch, deleteBranch, getBranchDetail,
};
