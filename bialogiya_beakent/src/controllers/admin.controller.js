const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');

// Reception accounts should only ever see their OWN branches' data (admin
// sees everything) - see utils/branchScope.js.
const { getOwnBranchIds } = require('../utils/branchScope');
const { getCenterId } = require('../utils/centerScope');
const cache = require('../utils/simpleCache');

const getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { branchId } = req.query;
    const branchIds = await getOwnBranchIds(req.user);

    const isAdmin = req.user.role === 'admin';
    if (branchId && branchIds && !branchIds.includes(branchId)) {
      return error(res, 'Forbidden', 403);
    }

    const centerScope = !isAdmin ? { centerId: req.user.centerId } : {};
    let teacherScope = centerScope;
    let groupScope = centerScope;
    let studentScope = centerScope;
    let lessonScope = centerScope;
    let recentUserScope = centerScope;

    let branchFilter = null;
    if (branchId) {
      branchFilter = { branchId };
    } else if (!isAdmin) {
      branchFilter = { branchId: { in: branchIds || [] } };
    }

    if (branchFilter) {
      teacherScope = { ...centerScope, ...branchFilter };
      groupScope = { ...centerScope, ...branchFilter };
      studentScope = { ...centerScope, OR: [{ ...branchFilter }, { group: branchFilter }] };
      lessonScope = { ...centerScope, group: branchFilter };
      recentUserScope = {
        ...centerScope,
        OR: [
          { role: 'teacher', ...branchFilter },
          { role: 'student', OR: [{ ...branchFilter }, { group: branchFilter }] }
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

    let branches = [];
    let totalManagers = 0;
    let pendingApplications = 0;

    let centers = [];
    let totalCenters = 0;
    let totalAIAgents = 0;

    if (req.user.role === 'admin') {
      const [branchRows, managersCount, applicationsCount, centerRows, aiAgentsCount] = await Promise.all([
        prisma.branch.findMany({
          where: { isActive: true },
          select: {
            id: true, name: true, address: true, studentCapacity: true,
            manager: { select: { id: true, name: true } },
            _count: { select: { groups: true, teachers: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: { role: 'manager', isActive: true } }),
        prisma.application.count({ where: { status: 'new' } }),
        prisma.center.findMany({
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, name: true, address: true, phone: true, email: true,
            website: true, isActive: true, createdAt: true,
            _count: { select: { branches: true, groups: true } },
          },
        }),
        prisma.aIAgent.count({ where: { isActive: true } }),
      ]);

      // count students per center
      const centerStudentCounts = await Promise.all(
        centerRows.map((c) => prisma.user.count({ where: { role: 'student', centerId: c.id, isActive: true } }))
      );

      centers = centerRows.map((c, i) => ({
        ...c,
        _count: { ...c._count, students: centerStudentCounts[i] },
      }));
      totalCenters = await prisma.center.count({ where: { isActive: true } });
      totalAIAgents = aiAgentsCount;

      const studentCounts = await Promise.all(
        branchRows.map((b) => prisma.user.count({ where: { role: 'student', isActive: true, OR: [{ branchId: b.id }, { group: { branchId: b.id } }] } }))
      );

      branches = branchRows.map((b, i) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        studentCapacity: b.studentCapacity,
        manager: b.manager,
        groupsCount: b._count.groups,
        teachersCount: b._count.teachers,
        studentsCount: studentCounts[i],
      }));
      totalManagers = managersCount;
      pendingApplications = applicationsCount;
    }

    return success(res, {
      totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers,
      branches, totalManagers, pendingApplications, totalBranches: branches.length,
      centers, totalCenters, totalAIAgents,
    });
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
        ? { branchId: { in: ownBranchIds } }
        : { branchId: { in: [] } };
    }

    const teachers = await prisma.user.findMany({
      where: { role: 'teacher', ...(!showInactive && { isActive: true }), ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}), ...branchFilter },
      select: {
        id: true, name: true, username: true, email: true, phone: true, branchId: true,
        isActive: true, createdAt: true, lastLogin: true,
        salaryType: true, salaryShare: true, fixedSalary: true, hourlyRate: true,
        branch: { select: { id: true, name: true } },
        _count: { select: { taughtGroups: true, students: true, lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, teachers);
  } catch (err) { next(err); }
};

// Reception/manager can only assign to one of their own branches (as returned
// by getOwnBranchIds, which covers both being the branch's assigned
// reception/manager AND the branch matching the user's own branchId field);
// admin can use any branch. This is the single source of truth for "is this
// branch mine" — it must stay in sync with getOwnBranchIds, or a branch that
// shows up in a reception/manager's own branch list (and therefore in their
// UI dropdowns) could get rejected here with a false 403.
const assertBranchAccess = async (branchId, user) => {
  if (!branchId) return user.role === 'manager' ? 'Branch is required' : null;
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return 'Branch not found';
  if (user.role === 'admin') return null;
  if (branch.centerId !== user.centerId) return 'Forbidden: not your center';
  if (user.role === 'reception' || user.role === 'manager') {
    const ownBranchIds = await getOwnBranchIds(user);
    if (!ownBranchIds?.includes(branch.id)) return 'Forbidden: not your branch';
  }
  return null;
};

const createTeacher = async (req, res, next) => {
  try {
    let { name, email, phone, language, branchId, password, salaryType, salaryShare, fixedSalary, hourlyRate } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const ownBranchIds = await getOwnBranchIds(req.user);
    if (!branchId && ownBranchIds && ownBranchIds.length > 0) {
      branchId = ownBranchIds[0];
    }

    const branchErr = await assertBranchAccess(branchId, req.user);
    if (branchErr) return error(res, branchErr, branchErr.startsWith('Forbidden') ? 403 : 404);

    // Resolve centerId: reception/manager always use their own centre;
    // admin has none of their own, so it's derived from the chosen branch.
    // Without this, teachers were created with centerId: null and silently
    // disappeared from every centre-scoped list (getTeachers filters by it).
    let centerId = getCenterId(req);
    if (!centerId && branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId }, select: { centerId: true } });
      centerId = branch?.centerId || null;
    }

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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        username,
        passwordHash,
        role: 'teacher',
        language: language || 'uz',
        branchId: branchId || null,
        centerId,
        salaryType: effectiveSalaryType,
        salaryShare: effectiveSalaryShare,
        fixedSalary: effectiveFixedSalary,
        hourlyRate: effectiveHourlyRate,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        salaryType: true,
        salaryShare: true,
        fixedSalary: true,
        hourlyRate: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
    });

    return success(res, { user, credentials: { username, password: code } }, 'Teacher created', 201);
  } catch (err) { next(err); }
};

const updateTeacher = async (req, res, next) => {
  try {
    let { name, phone, email, branchId, salaryType, salaryShare, fixedSalary, hourlyRate } = req.body;
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
        ...(salaryType && ['percent', 'fixed', 'hourly'].includes(salaryType) ? { salaryType } : {}),
        ...(salaryShare !== undefined && salaryShare !== '' ? { salaryShare: Math.max(1, Math.min(100, Number(salaryShare))) } : {}),
        ...(fixedSalary !== undefined ? { fixedSalary: fixedSalary ? Math.max(0, Number(fixedSalary)) : null } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate: hourlyRate ? Math.max(0, Number(hourlyRate)) : null } : {}),
      },
      select: {
        id: true, name: true, username: true, email: true, phone: true, isActive: true,
        salaryType: true, salaryShare: true, fixedSalary: true, hourlyRate: true,
        branch: { select: { id: true, name: true } },
      },
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
    const center = await resolveSettingsCenter(req);
    const userId = req.user.userId || req.user.id;

    const orConditions = [];
    if (center?.id) {
      orConditions.push({ centerId: center.id });
      orConditions.push({ branches: { some: { centerId: center.id } } });
    }
    if (req.user.centerId && req.user.centerId !== center?.id) {
      orConditions.push({ centerId: req.user.centerId });
    }
    if (req.user.role === 'manager' && userId) {
      orConditions.push({ branches: { some: { managerId: userId } } });
    }
    if (req.user.role === 'admin') {
      orConditions.push({ centerId: null });
    }

    const whereClause = {
      role: 'reception',
      ...(orConditions.length > 0 ? { OR: orConditions } : {})
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        isActive: true,
        isFrozen: true,
        permissions: true,
        maxBranches: true,
        createdAt: true,
        lastLogin: true,
        branchId: true,
        branches: {
          select: { id: true, name: true }
        },
        _count: { select: { branches: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, users);
  } catch (err) { next(err); }
};

const getReceptionStaffDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        language: true,
        isActive: true,
        isFrozen: true,
        permissions: true,
        maxBranches: true,
        createdAt: true,
        lastLogin: true,
        centerId: true,
        branchId: true,
        branches: {
          select: { id: true, name: true, address: true, studentCapacity: true }
        },
        center: {
          select: { id: true, name: true, settings: true }
        }
      }
    });

    if (!user || user.role !== 'reception') {
      return error(res, 'Reception user not found', 404);
    }

    // Resolve effective permissions
    const centerSettings = (user.center?.settings && typeof user.center?.settings === 'object') ? user.center.settings : {};
    const defaultCenterPerms = centerSettings.receptionPermissions || {
      canViewFinance: false,
      canViewCashbox: false,
      canManagePayments: true,
      canManageLeads: true,
      canManageTimetable: true,
      canManageGroups: true,
      canManageStudents: true,
      canManageTeachers: true,
    };

    const userOverrides = (user.permissions && typeof user.permissions === 'object')
      ? user.permissions
      : (centerSettings.receptionUserPermissions?.[user.id] || {});

    const effectivePermissions = {
      ...defaultCenterPerms,
      ...userOverrides,
    };

    // Stats
    const branchId = user.branches?.[0]?.id || user.branchId;
    let studentsCount = 0;
    let groupsCount = 0;
    let leadsCount = 0;

    if (branchId) {
      [studentsCount, groupsCount, leadsCount] = await Promise.all([
        prisma.user.count({ where: { role: 'student', branchId } }).catch(() => 0),
        prisma.group.count({ where: { branchId } }).catch(() => 0),
        prisma.lead.count({ where: { branchId } }).catch(() => 0),
      ]);
    }

    return success(res, {
      user: {
        ...user,
        effectivePermissions,
        userOverrides,
      },
      stats: {
        studentsCount,
        groupsCount,
        leadsCount,
      }
    });
  } catch (err) { next(err); }
};

const updateReceptionStaffPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') {
      return error(res, 'Permissions object required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, centerId: true, permissions: true }
    });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);

    const mergedUserPerms = {
      ...((user.permissions && typeof user.permissions === 'object') ? user.permissions : {}),
      ...permissions,
    };

    // Update User
    await prisma.user.update({
      where: { id },
      data: { permissions: mergedUserPerms }
    });

    // Also sync in center.settings.receptionUserPermissions
    const centerId = user.centerId || req.user.centerId;
    if (centerId) {
      const center = await prisma.center.findUnique({ where: { id: centerId }, select: { settings: true } });
      if (center) {
        const curSettings = (center.settings && typeof center.settings === 'object') ? center.settings : {};
        const existingUserMap = curSettings.receptionUserPermissions || {};
        await prisma.center.update({
          where: { id: centerId },
          data: {
            settings: {
              ...curSettings,
              receptionUserPermissions: {
                ...existingUserMap,
                [id]: mergedUserPerms,
              }
            }
          }
        });
      }
    }

    return success(res, { permissions: mergedUserPerms }, 'Qabulxona xodimi ruxsatlari muvaffaqiyatli saqlandi');
  } catch (err) { next(err); }
};

const toggleReceptionStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true, isFrozen: true }
    });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);

    let isFrozen = req.body.isFrozen;
    let isActive = req.body.isActive;

    if (isFrozen === undefined && isActive === undefined) {
      isFrozen = !user.isFrozen;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(isFrozen !== undefined && { isFrozen }),
        ...(isActive !== undefined && { isActive }),
      },
      select: { id: true, isActive: true, isFrozen: true }
    });

    return success(res, updated, isFrozen ? 'Qabulxona hisobi bloklandi' : 'Qabulxona hisobi faollashtirildi');
  } catch (err) { next(err); }
};

const createReceptionUser = async (req, res, next) => {
  try {
    const { name, email, phone, language, maxBranches, password, branchId, permissions } = req.body;
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

    const creatorCenter = await resolveSettingsCenter(req);
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
        centerId: creatorCenter?.id || req.user.centerId || null,
        maxBranches: Number.isFinite(Number(maxBranches)) && Number(maxBranches) > 0 ? Number(maxBranches) : 3,
        permissions: permissions && typeof permissions === 'object' ? permissions : {},
      },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true, maxBranches: true, centerId: true, permissions: true, createdAt: true },
    });

    if (branchId) {
      await prisma.branch.update({
        where: { id: branchId },
        data: {
          receptionId: user.id,
          ...(req.user.role === 'manager' && req.user.userId ? { managerId: req.user.userId } : {})
        },
      });
    }

    return success(res, { user, credentials: { username, password: code } }, 'Reception user created', 201);
  } catch (err) { next(err); }
};

// PUT /admin/reception/:id - admin/manager can change details, branch assignment, or active status
const updateReceptionUser = async (req, res, next) => {
  try {
    const { name, phone, email, maxBranches, branchId, isActive, isFrozen, permissions } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== req.params.id) return error(res, 'This email is already registered', 409);
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(isActive !== undefined && { isActive }),
        ...(isFrozen !== undefined && { isFrozen }),
        ...(permissions !== undefined && typeof permissions === 'object' && { permissions }),
        ...(maxBranches !== undefined && Number(maxBranches) > 0 && { maxBranches: Number(maxBranches) }),
      },
      select: { id: true, name: true, username: true, email: true, phone: true, maxBranches: true, isActive: true, isFrozen: true, permissions: true },
    });

    if (branchId !== undefined) {
      // Unlink previous branch assigned to this receptionist
      await prisma.branch.updateMany({
        where: { receptionId: user.id },
        data: { receptionId: null },
      });

      if (branchId) {
        await prisma.branch.update({
          where: { id: branchId },
          data: { receptionId: user.id },
        });
      }
    }

    return success(res, updated, 'Reception user updated');
  } catch (err) { next(err); }
};

const deleteReceptionUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false, isFrozen: true } });
    await prisma.branch.updateMany({
      where: { receptionId: req.params.id },
      data: { receptionId: null },
    });
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
        : { branchId: { in: [] } };
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        isActive: true,
        ...(groupId && { groupId }),
        ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}),
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
      where: ownBranchIds
        ? { centerId: req.user.centerId, branchId: { in: ownBranchIds } }
        : {},
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

const resolveSettingsCenter = async (req) => {
  // 1. If a specific centerId is explicitly passed in query, body, or headers:
  const targetId = req.query?.centerId || req.body?.centerId || req.headers?.['x-center-id'];
  if (targetId) {
    const center = await prisma.center.findUnique({ where: { id: targetId } });
    if (center) return center;
  }

  // 2. Lookup the authenticated user from the database
  const userId = req.user?.userId || req.user?.id;
  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, centerId: true, role: true, branchId: true }
    });

    if (dbUser?.centerId) {
      const center = await prisma.center.findUnique({ where: { id: dbUser.centerId } });
      if (center) return center;
    }

    // For operational roles (reception, teacher, student), try finding the center via branch
    if (['reception', 'teacher', 'student'].includes(dbUser?.role)) {
      if (dbUser?.branchId) {
        const branch = await prisma.branch.findUnique({ where: { id: dbUser.branchId }, select: { centerId: true } });
        if (branch?.centerId) {
          const center = await prisma.center.findUnique({ where: { id: branch.centerId } });
          if (center) {
            await prisma.user.update({ where: { id: userId }, data: { centerId: center.id } });
            return center;
          }
        }
      }
      const recBranch = await prisma.branch.findFirst({ where: { receptionId: userId }, select: { centerId: true } });
      if (recBranch?.centerId) {
        const center = await prisma.center.findUnique({ where: { id: recBranch.centerId } });
        if (center) {
          await prisma.user.update({ where: { id: userId }, data: { centerId: center.id } });
          return center;
        }
      }
    }

    // 3. User does not have a center assigned yet.
    // Auto-create a dedicated, isolated center for this user/admin so their settings
    // NEVER overwrite or get overwritten by another user's settings!
    const newCenter = await prisma.center.create({
      data: {
        name: req.body?.centerName || `${dbUser?.name || dbUser?.username || 'Asosiy'} O'quv Markazi`,
        settings: {}
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { centerId: newCenter.id }
    });

    if (req.user) req.user.centerId = newCenter.id;
    return newCenter;
  }

  // 4. Fallback if called without auth context
  let center = await prisma.center.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });
  if (center) return center;

  center = await prisma.center.create({
    data: {
      name: req.body?.centerName || 'Abdora AI Markazi',
      settings: {}
    }
  });
  return center;
};

const getSettings = async (req, res, next) => {
  try {
    const center = await resolveSettingsCenter(req);
    const rawSettings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const role = req.user?.role || 'admin';

    // Shared center-level info (same for all roles)
    const shared = {
      centerName: rawSettings.centerName || center.name || 'Abdora AI Markazi',
      centerAddress: rawSettings.centerAddress || center.address || '',
      centerPhone: rawSettings.centerPhone || center.phone || '',
      centerEmail: rawSettings.centerEmail || center.email || '',
      centerWebsite: rawSettings.centerWebsite || center.website || '',
      centerId: center.id,
      receptionPermissions: rawSettings.receptionPermissions || {},
      features: rawSettings.features || {
        aiEnabled: true,
        coinsEnabled: true,
        shopEnabled: true,
        smsEnabled: true,
      },
      leadStages: rawSettings.leadStages || [
        { id: 'new', label: 'Yangi murojaat', color: '#3b82f6', isSystem: true },
        { id: 'contacted', label: "Aloqa o'rnatildi", color: '#6366f1', isSystem: true },
        { id: 'trial', label: 'Sinov darsiga yozildi', color: '#06b6d4', isSystem: true },
        { id: 'attended', label: 'Sinov darsida qatnashdi', color: '#8b5cf6', isSystem: true },
        { id: 'waiting_payment', label: "To'lov kutilmoqda", color: '#f59e0b', isSystem: true },
        { id: 'enrolled', label: "Guruhga qo'shildi", color: '#10b981', isSystem: true },
      ],
      leadSources: rawSettings.leadSources || [
        'Instagram', 'Telegram', 'Facebook', 'TikTok', 'Tashqi banner', "Do'st tavsiyasi", 'Web sayt'
      ],
    };

    // Role-scoped preferences namespace
    const rolePrefsKey = role === 'reception' ? 'receptionPrefs'
                       : role === 'manager'   ? 'managerPrefs'
                       :                         'adminPrefs';
    const rolePrefs = rawSettings[rolePrefsKey] || {};

    // For backward compatibility: merge legacy flat keys into role prefs
    // (only if rolePrefs is empty, meaning first load after migration)
    const legacyKeys = [
      'receiptFormat', 'receiptNote', 'autoPrintReceipt', 'copyReceiptNumber',
      'showStaffOnReceipt', 'defaultPaymentMethod', 'timetableDefaultView',
      'soundNotifications', 'leadSoundAlert', 'paymentSoundAlert',
      'lessonReminderMinutes', 'theme', 'appearance',
      'maxStudentsPerGroup', 'minAttendancePercent', 'passingScore',
      'paymentDeadlineDay', 'allowInstallments', 'acceptedPaymentMethods',
      'workingHoursStart', 'workingHoursEnd', 'lessonDurationMinutes',
      'smsOnAbsent', 'smsPaymentReceipt', 'smsPaymentReminder',
    ];
    let backfilled = { ...rolePrefs };
    if (Object.keys(rolePrefs).length === 0) {
      for (const k of legacyKeys) {
        if (rawSettings[k] !== undefined) backfilled[k] = rawSettings[k];
      }
    }

    const merged = {
      ...shared,
      ...backfilled,
    };
    return success(res, merged);
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const center = await resolveSettingsCenter(req);
    const newSettings = req.body || {};
    const currentSettings = typeof center.settings === 'object' && center.settings !== null ? center.settings : {};
    const role = req.user?.role || 'admin';

    // Determine the role-specific prefs namespace key
    const rolePrefsKey = role === 'reception' ? 'receptionPrefs'
                       : role === 'manager'   ? 'managerPrefs'
                       :                         'adminPrefs';

    // Extract shared center-level fields that should update the center record directly
    const sharedFieldMap = {
      centerName: 'name', centerAddress: 'address', centerPhone: 'phone',
      centerEmail: 'email', centerWebsite: 'website',
    };
    const updateData = {};
    const roleSpecificData = {};
    const sharedSettingsUpdate = {};

    for (const [key, value] of Object.entries(newSettings)) {
      if (key === 'receptionPermissions' && typeof value === 'object') {
        // receptionPermissions is a shared cross-role setting (admin/manager control it)
        if (role === 'reception') continue; // reception cannot change its own permissions
        sharedSettingsUpdate.receptionPermissions = {
          ...(currentSettings.receptionPermissions || {}),
          ...value,
        };
      } else if (key === 'features' && typeof value === 'object') {
        sharedSettingsUpdate.features = {
          ...(currentSettings.features || { aiEnabled: true, coinsEnabled: true, shopEnabled: true, smsEnabled: true }),
          ...value,
        };
      } else if (key === 'leadStages' && Array.isArray(value)) {
        sharedSettingsUpdate.leadStages = value;
      } else if (key === 'leadSources' && Array.isArray(value)) {
        sharedSettingsUpdate.leadSources = value;
      } else if (sharedFieldMap[key] !== undefined) {
        // Shared center-level fields
        if (key === 'centerName' && role !== 'admin') continue; // only admin can rename center
        updateData[sharedFieldMap[key]] = value;
        sharedSettingsUpdate[key] = value;
      } else {
        // Everything else goes into role-scoped namespace
        roleSpecificData[key] = value;
      }
    }

    // Security: reception can only modify whitelisted keys
    if (role === 'reception') {
      const allowedReceptionKeys = [
        'receiptFormat', 'receiptNote', 'autoPrintReceipt', 'copyReceiptNumber',
        'showStaffOnReceipt', 'defaultPaymentMethod', 'timetableDefaultView',
        'soundNotifications', 'leadSoundAlert', 'paymentSoundAlert',
        'lessonReminderMinutes', 'receptionLanguage', 'theme', 'appearance',
      ];
      const filtered = {};
      for (const k of allowedReceptionKeys) {
        if (roleSpecificData[k] !== undefined) filtered[k] = roleSpecificData[k];
      }
      Object.keys(roleSpecificData).forEach(k => delete roleSpecificData[k]);
      Object.assign(roleSpecificData, filtered);
    }

    // Security: manager cannot modify platform-level core AI keys
    if (role === 'manager') {
      delete roleSpecificData.openaiApiKey;
      delete roleSpecificData.geminiApiKey;
      delete roleSpecificData.anthropicApiKey;
    }

    // Merge into center.settings preserving other roles' namespaces
    const mergedSettings = {
      ...currentSettings,
      ...sharedSettingsUpdate,
      [rolePrefsKey]: {
        ...(currentSettings[rolePrefsKey] || {}),
        ...roleSpecificData,
      },
    };

    updateData.settings = mergedSettings;

    const updated = await prisma.center.update({
      where: { id: center.id },
      data: updateData,
    });

    // Return the merged view for this role
    const rawSettings = typeof updated.settings === 'object' && updated.settings !== null ? updated.settings : {};
    const rolePrefs = rawSettings[rolePrefsKey] || {};
    const merged = {
      centerName: updated.name || 'Abdora AI Markazi',
      centerAddress: updated.address || '',
      centerPhone: updated.phone || '',
      centerEmail: updated.email || '',
      centerWebsite: updated.website || '',
      centerId: updated.id,
      receptionPermissions: rawSettings.receptionPermissions || {},
      ...rolePrefs,
    };

    return success(res, merged, 'Sozlamalar muvaffaqiyatli saqlandi');
  }
  catch (err) { next(err); }
};

// One-stop overview for a specific teacher: profile, groups, students, lessons,
// financial earnings, current balance, and salary payouts history.
const getTeacherOverview = async (req, res, next) => {
  try {
    const teacher = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isFrozen: true,
        createdAt: true,
        salaryType: true,
        salaryShare: true,
        fixedSalary: true,
        hourlyRate: true,
        branchId: true,
        branch: { select: { id: true, name: true, address: true } },
      },
    });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'O\'qituvchi topilmadi', 404);

    if (req.user.role === 'reception') {
      const ownBranchIds = await getOwnBranchIds(req.user);
      if (teacher.branchId && ownBranchIds && !ownBranchIds.includes(teacher.branchId)) {
        return error(res, 'Ruxsat berilmagan', 403);
      }
    }

    const groups = await prisma.group.findMany({
      where: { teacherId: teacher.id },
      select: {
        id: true,
        name: true,
        subject: true,
        monthlyFee: true,
        lessonDays: true,
        lessonTime: true,
        room: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { students: true, lessons: true } },
      },
      orderBy: { name: 'asc' },
    });

    const groupIds = groups.map(g => g.id);

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        isActive: true,
        OR: [
          { teacherId: teacher.id },
          ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : [])
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        xp: true,
        level: true,
        createdAt: true,
        group: { select: { id: true, name: true, monthlyFee: true } },
      },
      orderBy: { name: 'asc' },
    });

    const lessons = await prisma.lesson.findMany({
      where: { teacherId: teacher.id, isActive: true },
      select: {
        id: true,
        title: true,
        subject: true,
        createdAt: true,
        views: true,
        group: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const studentIds = students.map(s => s.id);
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    // All payments made by this teacher's students
    const payments = studentIds.length > 0
      ? await prisma.payment.findMany({
          where: {
            studentId: { in: studentIds },
            amount: { gt: 0 },
          },
          select: {
            id: true,
            amount: true,
            month: true,
            paidAt: true,
            method: true,
            student: { select: { id: true, name: true } },
          },
          orderBy: { paidAt: 'desc' },
        })
      : [];

    const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const thisMonthCollected = payments
      .filter(p => p.month === currentMonthStr || (p.paidAt && p.paidAt.toISOString().slice(0, 7) === currentMonthStr))
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const salaryType = teacher.salaryType || 'percent';
    const salaryShare = teacher.salaryShare ?? 50;
    let totalEarned = 0;
    let thisMonthEarned = 0;

    if (salaryType === 'fixed') {
      const monthsActive = Math.max(1, Math.ceil((Date.now() - new Date(teacher.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
      totalEarned = (teacher.fixedSalary || 0) * monthsActive;
      thisMonthEarned = teacher.fixedSalary || 0;
    } else if (salaryType === 'hourly') {
      const lessonCount = await prisma.lesson.count({ where: { teacherId: teacher.id, isActive: true } });
      totalEarned = (teacher.hourlyRate || 0) * lessonCount;
      thisMonthEarned = (teacher.hourlyRate || 0) * lessons.length;
    } else {
      totalEarned = Math.round((totalCollected * salaryShare) / 100);
      thisMonthEarned = Math.round((thisMonthCollected * salaryShare) / 100);
    }

    // Payouts recorded as expenses for this teacher
    const payouts = await prisma.expense.findMany({
      where: {
        category: 'salary',
        OR: [
          { note: { contains: teacher.id } },
          { title: { contains: teacher.name } },
        ],
      },
      select: {
        id: true,
        amount: true,
        date: true,
        method: true,
        note: true,
        title: true,
        createdAt: true,
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalPaid = payouts.reduce((acc, p) => acc + (p.amount || 0), 0);
    const balance = totalEarned - totalPaid;

    const shareLabel = salaryType === 'percent'
      ? (salaryShare === 33 ? '1/3 ulush' : salaryShare === 67 ? '2/3 ulush' : `${salaryShare}% ulush`)
      : salaryType === 'fixed'
      ? `Qat'iy oylik: ${teacher.fixedSalary ? teacher.fixedSalary.toLocaleString() : 0} so'm`
      : `Soatbay: ${teacher.hourlyRate ? teacher.hourlyRate.toLocaleString() : 0} so'm`;

    return success(res, {
      teacher: {
        ...teacher,
        shareLabel,
      },
      groups,
      students,
      lessons,
      financials: {
        totalCollected,
        thisMonthCollected,
        totalEarned,
        thisMonthEarned,
        totalPaid,
        balance,
        salaryType,
        salaryShare,
        fixedSalary: teacher.fixedSalary,
        hourlyRate: teacher.hourlyRate,
      },
      payouts,
    });
  } catch (err) { next(err); }
};

// Record a salary payout to a teacher (creates an Expense row with category='salary')
const recordTeacherPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, method, date, note, month } = req.body;

    const teacher = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, branchId: true, centerId: true },
    });
    if (!teacher || teacher.role !== 'teacher') return error(res, "O'qituvchi topilmadi", 404);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return error(res, "To'lov summasi 0 dan katta bo'lishi kerak", 400);
    }

    const payloadNote = `[TEACHER:${teacher.id}] ${month ? `(${month} oyi uchun) ` : ''}${note ? note.trim() : 'Oylik maosh'}`;

    const payoutExpense = await prisma.expense.create({
      data: {
        category: 'salary',
        type: 'expense',
        title: `${teacher.name} — Oylik maosh`,
        amount: Math.round(parsedAmount),
        date: date ? new Date(date) : new Date(),
        note: payloadNote,
        method: method || 'cash',
        branchId: teacher.branchId || null,
        centerId: teacher.centerId || req.user.centerId || null,
        createdById: req.user.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } },
      },
    });

    return success(res, payoutExpense, "O'qituvchiga to'lov muvaffaqiyatli saqlandi", 201);
  } catch (err) { next(err); }
};

// Update teacher's salary terms
const updateTeacherSalaryTerms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { salaryType, salaryShare, fixedSalary, hourlyRate } = req.body;

    const teacher = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!teacher || teacher.role !== 'teacher') return error(res, "O'qituvchi topilmadi", 404);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(salaryType ? { salaryType } : {}),
        ...(salaryShare !== undefined ? { salaryShare: Number(salaryShare) } : {}),
        ...(fixedSalary !== undefined ? { fixedSalary: Number(fixedSalary) } : {}),
        ...(hourlyRate !== undefined ? { hourlyRate: Number(hourlyRate) } : {}),
      },
      select: {
        id: true,
        name: true,
        salaryType: true,
        salaryShare: true,
        fixedSalary: true,
        hourlyRate: true,
      },
    });

    return success(res, updated, "Maosh shartlari muvaffaqiyatli yangilandi");
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
      branchData.centerId = req.user.centerId;
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
    const branch = await prisma.branch.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
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
    const branch = await prisma.branch.findFirst({ where: { id: req.params.id, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) } });
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
      where: { id: req.params.id, isActive: true, ...(req.user.role !== 'admin' ? { centerId: req.user.centerId } : {}) },
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
  } catch (err) { next(err); }
};

module.exports = {
  getStats, getTeachers, createTeacher, updateTeacher, deleteTeacher, getStudents, getGroups, toggleUserStatus, getSettings, updateSettings,
  getReceptionUsers, getReceptionStaffDetail, createReceptionUser, updateReceptionUser, updateReceptionStaffPermissions, toggleReceptionStaffStatus, deleteReceptionUser, getTeacherOverview,
  getBranches, createBranch, updateBranch, deleteBranch, getBranchDetail,
  recordTeacherPayout, updateTeacherSalaryTerms,
};
