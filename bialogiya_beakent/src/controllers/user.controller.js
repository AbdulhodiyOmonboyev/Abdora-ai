const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword, getPhoneCode } = require('../utils/generateCredentials');
const { getOwnBranchIds } = require('../utils/branchScope');
const { getCenterId } = require('../utils/centerScope');

const targetBranchId = (user) => user.role === 'teacher' ? user.branchId : user.group?.branchId;

const assertScopedUser = async (userId, reqUser, allowedRoles = null) => {
  const target = await prisma.user.findFirst({
    where: { id: userId },
    include: { group: { select: { branchId: true } } },
  });
  if (!target) return { error: 'User not found', status: 404 };
  if (reqUser.role !== 'admin' && target.centerId !== reqUser.centerId) return { error: 'Forbidden', status: 403 };
  if (allowedRoles && !allowedRoles.includes(target.role)) return { error: 'Forbidden', status: 403 };
  if (reqUser.role === 'teacher' && target.teacherId !== reqUser.userId) return { error: 'Forbidden', status: 403 };
  if (reqUser.role === 'admin') return { target };
  const ownBranchIds = await getOwnBranchIds(reqUser);
  if (!ownBranchIds || !ownBranchIds.includes(targetBranchId(target))) return { error: 'Forbidden', status: 403 };
  return { target };
};

const safeUser = (u) => {
  if (!u) return null;
  const { passwordHash, refreshTokenHash, ...rest } = u;
  return { ...rest, streak: { current: rest.streakCurrent, longest: rest.streakLongest, lastActiveDate: rest.streakLastDate } };
};

const createStudent = async (req, res, next) => {
  try {
    let { name, groupId, language, phone, password, branchId } = req.body;
    if (!name) return error(res, 'Name required', 400);

    let group = null;
    let teacherId = null;
    const centerId = getCenterId(req) || req.body.centerId || null;
    let effectiveBranchId = branchId || null;

    if (groupId) {
      group = await prisma.group.findFirst({ where: { id: groupId, ...(centerId ? { centerId } : {}) } });
      if (!group) return error(res, 'Group not found', 404);

      if (req.user.role !== 'admin') {
        const ownBranchIds = await getOwnBranchIds(req.user);
        if (group.branchId && ownBranchIds && !ownBranchIds.includes(group.branchId)) {
          return error(res, 'Forbidden: not your branch', 403);
        }
      }
      teacherId = group.teacherId;
      effectiveBranchId = group.branchId || effectiveBranchId;
    } else if (req.user.role !== 'admin') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (ownBranchIds && ownBranchIds.length > 0) {
        effectiveBranchId = ownBranchIds[0];
      }
    }

    const code = generatePassword(phone, password);
    let username = generateUsername(name, phone);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) username = `${username}${Math.floor(10 + Math.random() * 90)}`;

    const passwordHash = await bcrypt.hash(code, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        role: 'student',
        language: language || 'uz',
        groupId: groupId || null,
        teacherId: teacherId || null,
        branchId: effectiveBranchId || null,
        centerId,
        phone: phone || null,
      },
    });

    return success(res, { user: safeUser(user), credentials: { username, password: code } }, 'Student created', 201);
  } catch (err) { next(err); }
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, language, password } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const code = generatePassword(phone, password);
    let username = generateUsername(name, phone);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) username = `${username}${Math.floor(10 + Math.random() * 90)}`;

    const passwordHash = await bcrypt.hash(code, 10);

    const centerId = getCenterId(req) || req.body.centerId || null;
    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, username, passwordHash, role: 'teacher', language: language || 'uz', centerId },
    });

    return success(res, { user: safeUser(user), credentials: { username, password: code } }, 'Teacher created', 201);
  } catch (err) { next(err); }
};

const createManager = async (req, res, next) => {
  try {
    const { name, email, phone, gender, age, address, language, password, branchId } = req.body;
    if (!name) return error(res, 'Name required', 400);
    if (age !== undefined && age !== null && Number.isNaN(Number(age))) return error(res, 'Age must be a number', 400);

    const code = generatePassword(phone, password);
    const centerId = getCenterId(req) || req.body.centerId || null;
    let username = generateUsername(name, phone);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) username = `${username}${Math.floor(10 + Math.random() * 90)}`;

    let branch = null;
    if (branchId) {
      branch = await prisma.branch.findFirst({ where: { id: branchId, ...(centerId ? { centerId } : {}) } });
      if (!branch) return error(res, 'Branch not found', 404);
      if (branch.managerId) return error(res, 'Branch already assigned to another manager', 400);
    }

    const passwordHash = await bcrypt.hash(code, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        gender: gender || null,
        age: age ? Number(age) : null,
        address: address || null,
        username,
        passwordHash,
        role: 'manager',
        centerId,
        language: language || 'uz',
        ...(branchId ? { managedBranches: { connect: { id: branchId } } } : {}),
      },
    });

    return success(res, { user: safeUser(user), credentials: { username, password: code } }, 'Manager created', 201);
  } catch (err) { next(err); }
};

const getStudentsByTeacher = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { teacherId: req.user.userId, role: 'student', isActive: true, ...(req.user.centerId ? { centerId: req.user.centerId } : {}) },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, students.map(safeUser));
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { role, branchId } = req.query;
    const ownBranchIds = await getOwnBranchIds(req.user);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    // Add pagination and limit fields returned to reduce payload
    const page = Math.max(1, Number(req.query.page) || 1);
    const perPage = Math.min(100, Math.max(10, Number(req.query.perPage) || 50));

    const where = {
      ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (ownBranchIds) {
      where.OR = [
        { role: 'teacher', branchId: { in: ownBranchIds } },
        { role: 'student', group: { branchId: { in: ownBranchIds } } },
        { role: 'manager', managedBranches: { some: { id: { in: ownBranchIds } } } },
      ];
    }
    if (branchId) {
      if (ownBranchIds && !ownBranchIds.includes(branchId)) return error(res, 'Forbidden', 403);
      if (role === 'manager') {
        where.managedBranches = { some: { id: branchId } };
      } else {
        where.AND = [{ OR: [{ branchId }, { group: { branchId } }] }];
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, username: true, email: true, phone: true, role: true,
          avatar: true, isActive: true, isFrozen: true, groupId: true, branchId: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, users, 'Success', 200, { page, perPage, total });
  } catch (err) { next(err); }
};

const getUserById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { username: id },
          { phone: id },
        ],
      },
      include: {
        group: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } },
        branch: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, username: true } },
        branches: { select: { id: true, name: true } },
        managedBranches: { select: { id: true, name: true } },
        _count: { select: { students: true, taughtGroups: true } },
      },
    });
    if (!user) return error(res, 'User not found', 404);
    const access = await assertScopedUser(user.id, req.user);
    if (access.error) return error(res, access.error, access.status);
    return success(res, safeUser(user));
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, language, avatar, phone, gender, age, address, studyLocation, residence, alternativeWorkplace, birthDate } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, language, avatar, phone, gender, age: age ? Number(age) : null, address, studyLocation, residence, alternativeWorkplace, birthDate: birthDate ? new Date(birthDate) : null },
    });
    return success(res, safeUser(user));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, isActive, groupId, language, phone, gender, age, address, studyLocation, residence, alternativeWorkplace, birthDate } = req.body;
    const access = await assertScopedUser(req.params.id, req.user, ['student', 'teacher']);
    if (access.error) return error(res, access.error, access.status);
    const target = access.target;
    if (groupId && req.user.role !== 'admin') {
      const group = await prisma.group.findFirst({ where: { id: groupId, centerId: req.user.centerId }, select: { branchId: true, teacherId: true } });
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (!group || (group.branchId && !ownBranchIds?.includes(group.branchId)) || (req.user.role === 'teacher' && group.teacherId !== req.user.userId)) return error(res, 'Forbidden', 403);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, isActive, groupId, language, phone, gender, age: age ? Number(age) : null, address, studyLocation, residence, alternativeWorkplace, birthDate: birthDate ? new Date(birthDate) : null },
    });
    return success(res, safeUser(user));
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const target = await prisma.user.findFirst({
      where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
      select: { id: true, role: true, teacherId: true, branchId: true, group: { select: { branchId: true } } },
    });
    if (!target) return error(res, 'User not found', 404);
    if (req.user.role === 'teacher' && target.teacherId !== req.user.userId) return error(res, 'Forbidden', 403);

    if (req.user.role === 'reception') {
      // Never allow reception to deactivate an admin or another reception account.
      if (target.role !== 'teacher' && target.role !== 'student') return error(res, 'Forbidden', 403);
      const ownBranchIds = await getOwnBranchIds(req.user);
      const targetBranchId = target.role === 'teacher' ? target.branchId : target.group?.branchId;
      if (!targetBranchId || !ownBranchIds.includes(targetBranchId)) return error(res, 'Forbidden', 403);
    }

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'User deactivated');
  } catch (err) { next(err); }
};

const resetStudentPassword = async (req, res, next) => {
  try {
    const access = await assertScopedUser(req.params.id, req.user, ['student']);
    if (access.error) return error(res, access.error, access.status);
    const student = access.target;

    // Default: reset to last 4 digits of phone (the student's memorable password)
    const last4 = (student.phone || '').replace(/\D/g, '').slice(-4);
    const newPassword = (last4.length === 4 ? last4 : null) || req.body.newPassword || generatePassword(8);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    return success(res, { password: newPassword, username: student.username, name: student.name });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return error(res, 'currentPassword va newPassword talab qilinadi', 400);
    if (newPassword.length < 6) return error(res, 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak', 400);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return error(res, 'Joriy parol noto\'g\'ri', 401);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });

    return success(res, null, 'Parol muvaffaqiyatli o\'zgartirildi');
  } catch (err) { next(err); }
};

const freezeStudent = async (req, res, next) => {
  try {
    const access = await assertScopedUser(req.params.id, req.user, ['student']);
    if (access.error) return error(res, access.error, access.status);
    const student = access.target;
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isFrozen: !student.isFrozen },
    });
    return success(res, { isFrozen: updated.isFrozen }, updated.isFrozen ? 'Student frozen' : 'Student unfrozen');
  } catch (err) { next(err); }
};

const getManagers = async (req, res, next) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: 'manager', isActive: true },
      select: { id: true, name: true, username: true, email: true, phone: true, gender: true, age: true, address: true, isActive: true, createdAt: true, lastLogin: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, managers);
  } catch (err) { next(err); }
};

const updateManager = async (req, res, next) => {
  try {
    const { name, email, phone, gender, age, address } = req.body;
    const manager = await prisma.user.findFirst({ where: { id: req.params.id, role: 'manager', ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!manager) return error(res, 'Manager not found', 404);

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(gender !== undefined && { gender }),
        ...(age !== undefined && { age: age ? Number(age) : null }),
        ...(address !== undefined && { address }),
      },
      select: { id: true, name: true, username: true, email: true, phone: true, gender: true, age: true, address: true, isActive: true },
    });
    return success(res, updated, 'Manager updated');
  } catch (err) { next(err); }
};

const deleteManager = async (req, res, next) => {
  try {
    const manager = await prisma.user.findFirst({ where: { id: req.params.id, role: 'manager', ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
    if (!manager || manager.role !== 'manager') return error(res, 'Manager not found', 404);

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Manager deactivated');
  } catch (err) { next(err); }
};

const getManagerBranches = async (req, res, next) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { managerId: req.user.userId, isActive: true },
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
        _count: { select: { teachers: true } },
      },
    });

    const branchesWithCounts = await Promise.all(branches.map(async (branch) => {
      const studentsCount = await prisma.user.count({
        where: { role: 'student', group: { branchId: branch.id }, isActive: true },
      });
      return { ...branch, studentsCount };
    }));

    return success(res, branchesWithCounts);
  } catch (err) { next(err); }
};

module.exports = { createStudent, createTeacher, createManager, getManagers, updateManager, deleteManager, getManagerBranches, getStudentsByTeacher, getAllUsers, getUserById, updateProfile, updateUser, deleteUser, resetStudentPassword, freezeStudent, changePassword };
