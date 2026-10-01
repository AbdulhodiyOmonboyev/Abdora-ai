const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');
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
    const { name, email, phone, language, password, salaryType, salaryShare, fixedSalary, hourlyRate } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const effectiveSalaryType = ['percent', 'fixed', 'hourly'].includes(salaryType) ? salaryType : 'percent';
    const effectiveSalaryShare = effectiveSalaryType === 'percent'
      ? (salaryShare !== undefined && salaryShare !== '' ? Math.max(1, Math.min(100, Number(salaryShare))) : 50)
      : 50;
    const effectiveFixedSalary = effectiveSalaryType === 'fixed' && fixedSalary !== undefined && fixedSalary !== ''
      ? Math.max(0, Number(fixedSalary))
      : null;
    const effectiveHourlyRate = effectiveSalaryType === 'hourly' && hourlyRate !== undefined && hourlyRate !== ''
      ? Math.max(0, Number(hourlyRate))
      : null;

    const code = generatePassword(phone, password);
    let username = generateUsername(name, phone);

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) username = `${username}${Math.floor(10 + Math.random() * 90)}`;

    const passwordHash = await bcrypt.hash(code, 10);

    const centerId = getCenterId(req) || req.body.centerId || null;
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        username,
        passwordHash,
        role: 'teacher',
        language: language || 'uz',
        centerId,
        salaryType: effectiveSalaryType,
        salaryShare: effectiveSalaryShare,
        fixedSalary: effectiveFixedSalary,
        hourlyRate: effectiveHourlyRate,
      },
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
    };

    const andConditions = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (branchId) {
      if (ownBranchIds && !ownBranchIds.includes(branchId)) return error(res, 'Forbidden', 403);
      if (role === 'manager') {
        andConditions.push({ managedBranches: { some: { id: branchId } } });
      } else {
        andConditions.push({
          OR: [{ branchId }, { group: { branchId } }],
        });
      }
    } else if (ownBranchIds) {
      andConditions.push({
        OR: [
          { role: 'teacher', branchId: { in: ownBranchIds } },
          { role: 'student', OR: [{ branchId: { in: ownBranchIds } }, { group: { branchId: { in: ownBranchIds } } }] },
          { role: 'manager', managedBranches: { some: { id: { in: ownBranchIds } } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
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
    const {
      name, language, avatar, phone, gender, age, address,
      studyLocation, residence, alternativeWorkplace, birthDate,
      permissions, aiPreferences
    } = req.body;

    let updatedPermissions = permissions;
    if (aiPreferences !== undefined || permissions !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { permissions: true }
      });
      const currentPerms = (currentUser?.permissions && typeof currentUser.permissions === 'object') ? currentUser.permissions : {};
      updatedPermissions = {
        ...currentPerms,
        ...(permissions || {}),
        ...(aiPreferences !== undefined ? {
          aiPreferences: {
            ...(currentPerms.aiPreferences || {}),
            ...aiPreferences
          }
        } : {})
      };
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(language !== undefined && { language }),
      ...(avatar !== undefined && { avatar }),
      ...(phone !== undefined && { phone }),
      ...(gender !== undefined && { gender }),
      ...(age !== undefined && { age: age ? Number(age) : null }),
      ...(address !== undefined && { address }),
      ...(studyLocation !== undefined && { studyLocation }),
      ...(residence !== undefined && { residence }),
      ...(alternativeWorkplace !== undefined && { alternativeWorkplace }),
      ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
      ...(updatedPermissions !== undefined && { permissions: updatedPermissions }),
    };

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
    });
    return success(res, safeUser(user));
  } catch (err) { next(err); }
};

const updateLanguage = async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!language || !['uz', 'ru', 'en'].includes(language)) {
      return error(res, 'Yaroqsiz til (uz, ru, en talab qilinadi)', 400);
    }
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { language },
      select: { id: true, language: true, name: true, username: true },
    });
    return success(res, user, 'Til muvaffaqiyatli yangilandi');
  } catch (err) { next(err); }
};

const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'Rasm fayli yuklanmadi', 400);
    const row = await prisma.uploadedFile.create({
      data: {
        name: req.file.originalname || 'avatar.jpg',
        mimeType: req.file.mimetype || 'image/jpeg',
        data: req.file.buffer,
        centerId: req.user?.centerId || null,
      },
    });
    const avatarUrl = `/api/users/avatar/${row.id}`;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { avatar: avatarUrl },
    });
    return success(res, safeUser(user), 'Avatar muvaffaqiyatli saqlandi');
  } catch (err) { next(err); }
};

const getAvatar = async (req, res, next) => {
  try {
    const file = await prisma.uploadedFile.findUnique({
      where: { id: req.params.id },
    });
    if (!file) return res.status(404).send('Avatar topilmadi');
    res.set({
      'Content-Type': file.mimeType || 'image/jpeg',
      'Content-Length': file.data.length,
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(file.data);
  } catch (err) { next(err); }
};


const testAIPersonalization = async (req, res, next) => {
  try {
    const { message, aiPreferences: bodyPreferences } = req.body;
    if (!message) return error(res, 'Xabar kiritilmadi', 400);

    let aiPreferences = bodyPreferences;
    if (!aiPreferences) {
      const userRecord = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { permissions: true }
      });
      aiPreferences = userRecord?.permissions?.aiPreferences || {};
    }

    const { getChatSystemPrompt } = require('../services/ai/prompts');
    const { getModel } = require('../config/gemini');

    const systemPrompt = getChatSystemPrompt(
      "Abdora AI Shaxsiy Yordamchi",
      "O'quvchining sevimli qiziqishlari va o'rganish uslubi bo'yicha moslashtirilgan ta'limiy suhbat.",
      aiPreferences?.style || 'normal',
      aiPreferences?.language || 'uz',
      aiPreferences
    );

    const fullPrompt = `${systemPrompt}\n\nStudent: ${message}\nAbdora AI:`;
    const model = getModel(false);
    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text().trim();

    return success(res, { reply });
  } catch (err) {
    console.error('AI test error:', err);
    return error(res, err.message || 'AI xizmatida xatolik yuz berdi', 500);
  }
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
      where: { managerId: req.user.userId, centerId: req.user.centerId, isActive: true },
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

const getStudentHistory = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'student',
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        gender: true,
        age: true,
        birthDate: true,
        address: true,
        studyLocation: true,
        residence: true,
        isActive: true,
        isFrozen: true,
        xp: true,
        coins: true,
        level: true,
        streakCurrent: true,
        streakLongest: true,
        streakLastDate: true,
        achievements: true,
        createdAt: true,
        lastLogin: true,
        groupId: true,
        teacherId: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, username: true, phone: true } },
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            monthlyFee: true,
            weekDays: true,
            startTime: true,
            endTime: true,
            room: true,
            level: true,
            totalLessons: true,
            startDate: true,
            branch: { select: { id: true, name: true } },
            teacher: { select: { id: true, name: true, phone: true } },
            _count: { select: { students: true } },
          },
        },
      },
    });

    if (!student) return error(res, "O'quvchi topilmadi", 404);

    // 1. Payments
    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: [{ month: 'desc' }, { paidAt: 'desc' }],
      select: {
        id: true,
        month: true,
        amount: true,
        expectedAmount: true,
        status: true,
        method: true,
        note: true,
        paidAt: true,
        createdAt: true,
      },
    });

    // 2. Test results
    const testResults = await prisma.result.findMany({
      where: { studentId: student.id },
      orderBy: { completedAt: 'desc' },
      take: 50,
      include: {
        test: {
          select: {
            id: true,
            title: true,
            type: true,
            totalPoints: true,
            passingScore: true,
            timeLimit: true,
          },
        },
      },
    });

    // 3. Homework submissions
    const submissions = await prisma.submission.findMany({
      where: { studentId: student.id },
      orderBy: { submittedAt: 'desc' },
      take: 50,
      include: {
        homework: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            dueDate: true,
          },
        },
      },
    });

    // 4. Attendance
    let attendanceList = [];
    if (student.groupId) {
      const attendances = await prisma.attendance.findMany({
        where: { groupId: student.groupId },
        orderBy: { date: 'desc' },
        take: 60,
        select: {
          id: true,
          date: true,
          records: true,
          group: { select: { name: true } },
        },
      });

      attendanceList = attendances.map((a) => {
        const recs = Array.isArray(a.records) ? a.records : [];
        const rec = recs.find((r) => r.studentId === student.id);
        return {
          id: a.id,
          date: a.date,
          groupName: a.group?.name || student.group?.name,
          status: rec?.status || 'absent',
          grade: rec?.grade !== undefined ? rec.grade : null,
          coinsChange: rec?.coinsChange !== undefined ? rec.coinsChange : null,
          note: rec?.note || '',
        };
      });
    }

    // 5. Notes, Custom transactions, Game activities, and Referrals stored in achievements
    let notes = [];
    let customTransactions = [];
    let gameActivities = [];
    let referrals = [];
    let referredBy = null;

    if (student.achievements) {
      if (Array.isArray(student.achievements)) {
        notes = student.achievements.filter((x) => x && x.type === 'note');
        customTransactions = student.achievements.filter((x) => x && x.type === 'coin_transaction');
      } else if (typeof student.achievements === 'object') {
        notes = Array.isArray(student.achievements.notes) ? student.achievements.notes : [];
        customTransactions = Array.isArray(student.achievements.coinTransactions) ? student.achievements.coinTransactions : [];
        gameActivities = Array.isArray(student.achievements.gameActivities) ? student.achievements.gameActivities : [];
        referrals = Array.isArray(student.achievements.referrals) ? student.achievements.referrals : [];
        referredBy = student.achievements.referredBy || null;
      }
    }

    // 6. Chronological Coin & XP History (Barcha real operatsiyalar)
    const coinHistory = [];

    // a) From tests
    testResults.forEach((r) => {
      coinHistory.push({
        id: `test_${r.id}`,
        type: 'test',
        title: `Test: ${r.test?.title || 'Sinov'} (${r.percentage}%)`,
        coins: r.passed ? (r.percentage === 100 ? 20 : 10) : 0,
        xp: r.score || (r.passed ? 40 : 10),
        date: r.completedAt,
        status: r.passed ? 'Muvaffaqiyatli' : 'Yiqildi',
      });
    });

    // b) From homework
    submissions.forEach((s) => {
      const isGood = (s.finalScore || 0) >= 80;
      coinHistory.push({
        id: `hw_${s.id}`,
        type: 'homework',
        title: `Uyga vazifa: ${s.homework?.title || 'Topshiriq'}`,
        coins: isGood ? 15 : ((s.finalScore || 0) > 0 ? 5 : 0),
        xp: s.finalScore || 20,
        date: s.submittedAt,
        status: s.status || 'Topshirildi',
      });
    });

    // c) From attendance
    attendanceList.forEach((a) => {
      let coins = a.coinsChange;
      let xp = 0;
      let title = `Dars davomati (${a.groupName || 'Guruh'})`;

      if (a.grade !== null && a.grade !== undefined) {
        title = `Dars davomati va baho: ${a.grade}/10`;
        xp = a.grade * 10;
        if (coins === null || coins === undefined) {
          coins = a.grade >= 8 ? 5 : (a.grade <= 3 ? -3 : 0);
        }
      } else {
        if (coins === null || coins === undefined) {
          coins = a.status === 'present' ? 3 : (a.status === 'absent' ? -3 : 0);
        }
        xp = a.status === 'present' ? 15 : 0;
      }

      if (coins !== 0 || xp !== 0) {
        coinHistory.push({
          id: `att_${a.id}`,
          type: 'attendance',
          title,
          coins: coins || 0,
          xp,
          date: a.date,
          status: a.status === 'present' ? 'Qatnashdi' : (a.status === 'absent' ? 'Qatnashmadi' : 'Kechikdi'),
        });
      }
    });

    // d) From Shop orders
    try {
      const center = await prisma.center.findFirst({
        where: student.centerId ? { id: student.centerId } : { isActive: true },
        select: { settings: true },
      });
      if (center && center.settings && Array.isArray(center.settings.shopOrders)) {
        const studentOrders = center.settings.shopOrders.filter((o) => o.studentId === student.id);
        studentOrders.forEach((o) => {
          const cost = Math.abs(o.priceCoins || 0);
          coinHistory.push({
            id: `order_${o.id}`,
            type: 'purchase',
            title: `Do'kondan xarid: ${o.itemTitle || 'Mahsulot'}`,
            coins: -cost,
            xp: 0,
            date: o.createdAt,
            status: o.status === 'fulfilled' ? 'Yetkazildi' : (o.status === 'cancelled' ? 'Bekor qilindi' : 'Kutilmoqda'),
          });
        });
      }
    } catch (_) {}

    // e) From Game activities
    gameActivities.forEach((g) => {
      coinHistory.push({
        id: `game_${g.id || Math.random()}`,
        type: 'game',
        title: g.mode === 'duel'
          ? `Guruhdosh bilan duel: ${g.topicTitle || 'Mavzu'}`
          : `Interaktiv o'yin: ${g.topicTitle || 'Mavzu'}`,
        coins: g.coinsGained || 15,
        xp: g.xpGained || Math.max(10, Math.round((Number(g.score) || 0) / 2)),
        date: g.createdAt,
        status: g.isWon ? "G'alaba" : "Yakunlandi",
      });
    });

    // f) From Referrals
    referrals.forEach((ref) => {
      coinHistory.push({
        id: `ref_${ref.id || Math.random()}`,
        type: 'bonus',
        title: `Referal taklifi bonusi: ${ref.studentName || 'Do\'stingiz'}`,
        coins: ref.coins || 50,
        xp: 25,
        date: ref.date || ref.createdAt || new Date().toISOString(),
        status: 'Kirim',
      });
    });
    if (referredBy) {
      coinHistory.push({
        id: `ref_by_${Math.random()}`,
        type: 'bonus',
        title: `Referal kodi sovg'asi (${referredBy.inviterName || 'Taklif'})`,
        coins: 50,
        xp: 25,
        date: referredBy.date || new Date().toISOString(),
        status: 'Kirim',
      });
    }

    // g) Custom bonuses / penalties
    customTransactions.forEach((ct) => {
      coinHistory.push({
        id: ct.id || `custom_${Math.random()}`,
        type: ct.type || 'bonus',
        title: ct.title || "O'qituvchi/Admin bonusi",
        coins: ct.coins || 0,
        xp: ct.xp || 0,
        date: ct.date || ct.createdAt,
        status: (ct.coins || 0) >= 0 ? 'Bonus' : 'Jarima',
        authorName: ct.authorName,
      });
    });

    // Sort by date descending
    coinHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // EXP tarixi (Alohida saralangan ro'yxat)
    const expHistory = coinHistory
      .filter((item) => (item.xp || 0) > 0)
      .map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        category: item.type === 'homework' ? 'Uyga vazifa' : (item.type === 'test' ? 'Test sinovi' : (item.type === 'game' ? 'O\'yinlar' : (item.type === 'attendance' ? 'Darslar' : 'Rag\'bat bonusi'))),
        amount: item.xp,
        isPositive: true,
        date: item.date,
        status: item.status,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Jami kirim va xaridlar
    const totalCoinsEarned = coinHistory.reduce((acc, c) => c.coins > 0 ? acc + c.coins : acc, 0);
    const totalCoinsSpent = coinHistory.reduce((acc, c) => c.coins < 0 ? acc + Math.abs(c.coins) : acc, 0);

    // Referal ma'lumotlari
    const referralCode = 'ABDORA-' + (student.username || 'TALABA').toUpperCase();
    const referralData = {
      code: referralCode,
      invitedCount: referrals.length,
      earnedCoins: referrals.length * 50,
      hasUsedReferral: !!referredBy,
      referrals,
    };

    // 7. Financial Summary
    const monthlyFee = student.group?.monthlyFee || 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentPayment = payments.find((p) => p.month === currentMonth);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDebt = payments.reduce((sum, p) => sum + Math.max(0, (p.expectedAmount || 0) - (p.amount || 0)), 0);

    // 8. Attendance Summary
    const totalLessons = attendanceList.length;
    const presentCount = attendanceList.filter((a) => a.status === 'present').length;
    const absentCount = attendanceList.filter((a) => a.status === 'absent').length;
    const lateCount = attendanceList.filter((a) => a.status === 'late').length;
    const excusedCount = attendanceList.filter((a) => a.status === 'excused').length;
    const attendanceRate = totalLessons > 0 ? Math.round((presentCount / totalLessons) * 100) : 100;

    return success(res, {
      student,
      group: student.group,
      payments,
      attendance: attendanceList,
      tests: testResults,
      homework: submissions,
      coinHistory,
      expHistory,
      referral: referralData,
      notes,
      summary: {
        totalCoins: student.coins || 0,
        totalCoinsEarned,
        totalCoinsSpent,
        totalXP: student.xp || 0,
        level: student.level || 1,
        referral: referralData,
        totalPaid,
        totalDebt,
        monthlyFee,
        currentMonth,
        isCurrentMonthPaid: currentPayment?.status === 'paid',
        currentPayment,
        totalLessons,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
        totalTests: testResults.length,
        passedTests: testResults.filter((t) => t.passed).length,
        totalHomework: submissions.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const addStudentNote = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const { text } = req.body;
    if (!text || !text.trim()) return error(res, 'Eslatma matni kiritilmadi', 400);

    const student = await prisma.user.findFirst({ where: { id: studentId, role: 'student' } });
    if (!student) return error(res, "O'quvchi topilmadi", 404);

    const existingAchievements = student.achievements && typeof student.achievements === 'object' && !Array.isArray(student.achievements)
      ? student.achievements
      : { badges: Array.isArray(student.achievements) ? student.achievements : [], notes: [], coinTransactions: [] };

    const notes = Array.isArray(existingAchievements.notes) ? existingAchievements.notes : [];
    const newNote = {
      id: 'note_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      text: text.trim(),
      authorName: req.user.name || req.user.username || 'Xodim',
      authorRole: req.user.role,
      createdAt: new Date().toISOString(),
    };
    notes.unshift(newNote);

    await prisma.user.update({
      where: { id: studentId },
      data: {
        achievements: {
          ...existingAchievements,
          notes,
        },
      },
    });

    return success(res, newNote, 'Eslatma saqlandi', 201);
  } catch (err) {
    next(err);
  }
};

const deleteStudentNote = async (req, res, next) => {
  try {
    const { id: studentId, noteId } = req.params;
    const student = await prisma.user.findFirst({ where: { id: studentId, role: 'student' } });
    if (!student) return error(res, "O'quvchi topilmadi", 404);

    const existingAchievements = student.achievements && typeof student.achievements === 'object' && !Array.isArray(student.achievements)
      ? student.achievements
      : { badges: [], notes: [], coinTransactions: [] };

    const notes = (Array.isArray(existingAchievements.notes) ? existingAchievements.notes : []).filter((n) => n.id !== noteId);

    await prisma.user.update({
      where: { id: studentId },
      data: {
        achievements: {
          ...existingAchievements,
          notes,
        },
      },
    });

    return success(res, null, "Eslatma o'chirildi");
  } catch (err) {
    next(err);
  }
};

const awardStudentCoins = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    const { coins, xp, reason } = req.body;
    const coinAmount = Number(coins) || 0;
    const xpAmount = Number(xp) || 0;

    if (coinAmount === 0 && xpAmount === 0) return error(res, 'Tanga yoki XP miqdorini kiriting', 400);

    const student = await prisma.user.findFirst({ where: { id: studentId, role: 'student' } });
    if (!student) return error(res, "O'quvchi topilmadi", 404);

    const existingAchievements = student.achievements && typeof student.achievements === 'object' && !Array.isArray(student.achievements)
      ? student.achievements
      : { badges: Array.isArray(student.achievements) ? student.achievements : [], notes: [], coinTransactions: [] };

    const coinTransactions = Array.isArray(existingAchievements.coinTransactions) ? existingAchievements.coinTransactions : [];
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      type: 'coin_transaction',
      title: reason || "O'qituvchi/Admin bonusi",
      coins: coinAmount,
      xp: xpAmount,
      authorName: req.user.name || req.user.username || 'Xodim',
      date: new Date().toISOString(),
    };
    coinTransactions.unshift(newTx);

    const newCoins = Math.max(0, (student.coins || 0) + coinAmount);
    const newXP = Math.max(0, (student.xp || 0) + xpAmount);

    const updated = await prisma.user.update({
      where: { id: studentId },
      data: {
        coins: newCoins,
        xp: newXP,
        achievements: {
          ...existingAchievements,
          coinTransactions,
        },
      },
      select: { id: true, name: true, coins: true, xp: true, level: true },
    });

    // O'quvchiga bildirishnoma jo'natish
    try {
      await prisma.notification.create({
        data: {
          userId: studentId,
          type: coinAmount >= 0 ? 'achievement' : 'warning',
          title: coinAmount >= 0 ? "Tangalar hisobingizga qo'shildi" : 'Tangalar yechildi',
          message: `${reason || "Rag'batlantirish"}: ${coinAmount >= 0 ? '+' : ''}${coinAmount} tanga, +${xpAmount} XP`,
          centerId: student.centerId || req.user.centerId || null,
        },
      });
    } catch (_) {}

    return success(res, { updated, transaction: newTx }, 'Tangalar hisoblandi');
  } catch (err) {
    next(err);
  }
};

const getReferralStats = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, phone: true, name: true, coins: true, achievements: true },
    });
    if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);

    const achievements = user.achievements && typeof user.achievements === 'object' && !Array.isArray(user.achievements)
      ? user.achievements
      : {};

    const referrals = Array.isArray(achievements.referrals) ? achievements.referrals : [];
    const referralCode = 'ABDORA-' + (user.username || user.phone || 'TALABA').toUpperCase();

    return success(res, {
      referralCode,
      invitedCount: referrals.length,
      earnedCoins: referrals.length * 50,
      hasUsedReferral: !!achievements.referredBy,
      referrals,
    });
  } catch (err) {
    next(err);
  }
};

const applyReferralCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) return error(res, 'Referal kodi kiritilmadi', 400);

    const student = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!student) return error(res, 'Foydalanuvchi topilmadi', 404);

    const existingAchievements = student.achievements && typeof student.achievements === 'object' && !Array.isArray(student.achievements)
      ? student.achievements
      : { notes: [], coinTransactions: [], referrals: [] };

    if (existingAchievements.referredBy) {
      return error(res, 'Siz allaqachon referal kodidan foydalangansiz', 400);
    }

    const clean = code.trim().replace(/^ABDORA-/i, '').toLowerCase();

    // Taklif qilgan foydalanuvchini topish
    const inviter = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: clean, mode: 'insensitive' } },
          { phone: clean },
          { phone: '+' + clean },
        ],
      },
    });

    if (!inviter) {
      return error(res, 'Bunday referal kodi topilmadi', 404);
    }

    if (inviter.id === student.id) {
      return error(res, "O'zingizning referal kodingizdan foydalana olmaysiz", 400);
    }

    const BONUS = 50;

    // 1. Taklif qiluvchiga mukofot berish
    const inviterAch = inviter.achievements && typeof inviter.achievements === 'object' && !Array.isArray(inviter.achievements)
      ? inviter.achievements
      : { notes: [], coinTransactions: [], referrals: [] };
    const inviterRefs = Array.isArray(inviterAch.referrals) ? [...inviterAch.referrals] : [];
    inviterRefs.unshift({
      studentId: student.id,
      studentName: student.name,
      coins: BONUS,
      date: new Date().toISOString(),
    });
    const inviterCoinTx = Array.isArray(inviterAch.coinTransactions) ? [...inviterAch.coinTransactions] : [];
    inviterCoinTx.unshift({
      id: `ref_award_${Date.now()}`,
      type: 'bonus',
      title: `Referal bonusi: ${student.name} taklifingiz bilan kirdi`,
      coins: BONUS,
      xp: 25,
      date: new Date().toISOString(),
    });

    await prisma.user.update({
      where: { id: inviter.id },
      data: {
        coins: { increment: BONUS },
        achievements: {
          ...inviterAch,
          referrals: inviterRefs,
          coinTransactions: inviterCoinTx,
        },
      },
    });

    // Taklif qiluvchiga bildirishnoma
    try {
      await prisma.notification.create({
        data: {
          userId: inviter.id,
          type: 'achievement',
          title: "Yangi do'st qo'shildi!",
          message: `${student.name} sizning referal kodingizdan foydalandi. Hisobingizga +${BONUS} tanga sovg'a qilindi!`,
          centerId: inviter.centerId || null,
        },
      });
    } catch (_) {}

    // 2. Joriy o'quvchiga mukofot berish
    const studentCoinTx = Array.isArray(existingAchievements.coinTransactions) ? [...existingAchievements.coinTransactions] : [];
    studentCoinTx.unshift({
      id: `ref_bonus_${Date.now()}`,
      type: 'bonus',
      title: `Referal sovg'asi: ${inviter.name} taklifi bo'yicha`,
      coins: BONUS,
      xp: 25,
      date: new Date().toISOString(),
    });

    await prisma.user.update({
      where: { id: student.id },
      data: {
        coins: { increment: BONUS },
        achievements: {
          ...existingAchievements,
          referredBy: {
            inviterId: inviter.id,
            inviterName: inviter.name,
            code: code.trim(),
            date: new Date().toISOString(),
          },
          coinTransactions: studentCoinTx,
        },
      },
    });

    // Joriy o'quvchiga bildirishnoma
    try {
      await prisma.notification.create({
        data: {
          userId: student.id,
          type: 'achievement',
          title: "Referal sovg'asi qabul qilindi!",
          message: `Referal kodi faollashtirildi. Hisobingizga +${BONUS} oltin tanga qo'shildi!`,
          centerId: student.centerId || null,
        },
      });
    } catch (_) {}

    return success(res, { coinsAwarded: BONUS, inviterName: inviter.name }, `Tabriklaymiz! Hisobingizga +${BONUS} tanga sovg'a qilindi.`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStudent,
  createTeacher,
  createManager,
  getManagers,
  updateManager,
  deleteManager,
  getManagerBranches,
  getStudentsByTeacher,
  getAllUsers,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  resetStudentPassword,
  freezeStudent,
  changePassword,
  getStudentHistory,
  addStudentNote,
  deleteStudentNote,
  awardStudentCoins,
  testAIPersonalization,
  updateLanguage,
  uploadAvatar,
  getAvatar,
  getReferralStats,
  applyReferralCode,
};
