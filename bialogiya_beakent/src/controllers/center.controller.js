const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');
const cache = require('../utils/simpleCache');
const { cleanupOrphanedRecords } = require('../utils/cleanupOrphans');

// GET /admin/centers
const getCenters = async (req, res, next) => {
  try {
    const centers = await prisma.center.findMany({
      where: { isActive: true },
      include: {
        branches: {
          where: { isActive: true },
          select: { id: true, name: true, address: true, isActive: true },
        },
        users: {
          where: { role: 'manager', isActive: true },
          select: { id: true, name: true, username: true, phone: true },
        },
        _count: {
          select: {
            users: true,
            groups: true,
            branches: true,
            leads: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count active students, branches, and groups per center separately
    const [studentCounts, branchCounts, groupCounts] = await Promise.all([
      Promise.all(centers.map((c) => prisma.user.count({ where: { role: 'student', centerId: c.id, isActive: true } }))),
      Promise.all(centers.map((c) => prisma.branch.count({ where: { centerId: c.id, isActive: true } }))),
      Promise.all(centers.map((c) => prisma.group.count({ where: { centerId: c.id, isActive: true } }))),
    ]);

    const formatted = centers.map((c, i) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      phone: c.phone,
      email: c.email || null,
      website: c.website || null,
      isActive: c.isActive,
      createdAt: c.createdAt,
      settings: c.settings,
      _count: {
        branches: branchCounts[i],
        students: studentCounts[i],
        groups: groupCounts[i],
        leads: c._count.leads,
      },
      branches: c.branches,
      managers: c.users,
      primaryManager: c.users[0] || null,
    }));

    return success(res, formatted);
  } catch (err) {
    next(err);
  }
};

// POST /admin/centers
const createCenter = async (req, res, next) => {
  try {
    const {
      name,
      address,
      phone,
      managerName,
      managerUsername,
      managerPassword,
      managerPhone,
    } = req.body;

    if (!name?.trim()) return error(res, 'O\'quv markaz nomi kiritilishi shart', 400);

    // 1. Create Center
    const center = await prisma.center.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        settings: {},
      },
    });

    let manager = null;
    let credentials = null;

    // 2. If manager account details provided, create manager account for this center
    if (managerName?.trim()) {
      const username = managerUsername?.trim() || generateUsername(managerName, managerPhone || phone);
      const rawPassword = managerPassword?.trim() || generatePassword(managerPhone || phone);
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      // Ensure username uniqueness
      const existingUser = await prisma.user.findUnique({ where: { username } });
      const finalUsername = existingUser ? `${username}_${Math.floor(100 + Math.random() * 900)}` : username;

      manager = await prisma.user.create({
        data: {
          name: managerName.trim(),
          username: finalUsername,
          passwordHash,
          phone: managerPhone?.trim() || phone?.trim() || null,
          role: 'manager',
          centerId: center.id,
        },
      });

      credentials = {
        name: manager.name,
        username: finalUsername,
        password: rawPassword,
      };
    }
 
    cache.flushAll();
    return success(res, {
      center,
      manager,
      credentials,
    }, 'O\'quv markaz va boshqaruvchi hisobi muvaffaqiyatli yaratildi', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /admin/centers/:id
const updateCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, website, isActive, settings } = req.body;

    const existing = await prisma.center.findUnique({ where: { id } });
    if (!existing) return error(res, 'O\'quv markaz topilmadi', 404);

    const updated = await prisma.center.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        ...(settings !== undefined && { settings }),
      },
    });

    cache.flushAll();
    return success(res, updated, 'O\'quv markaz yangilandi');
  } catch (err) {
    next(err);
  }
};

// DELETE /admin/centers/:id
const deleteCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.center.findUnique({ where: { id } });
    if (!existing) return error(res, 'O\'quv markaz topilmadi', 404);

    // Kaskadli to'liq o'chirish: filiallar, guruhlar, barcha foydalanuvchilar va bog'liq ma'lumotlar
    await prisma.$transaction(async (tx) => {
      // 1. Markazning barcha filiallarini olish
      const branches = await tx.branch.findMany({ where: { centerId: id }, select: { id: true } });
      const bIds = branches.map((b) => b.id);

      // 2. Markaz va filiallar guruhlarini olish
      const groups = await tx.group.findMany({
        where: { OR: [{ centerId: id }, { branchId: { in: bIds } }] },
        select: { id: true },
      });
      const gIds = groups.map((g) => g.id);

      // 3. Markazga tegishli barcha foydalanuvchilar (menejerlar, o'qituvchilar, o'quvchilar, resepshn)
      const users = await tx.user.findMany({
        where: {
          OR: [
            { centerId: id },
            { branchId: { in: bIds } },
            { groupId: { in: gIds } },
            { taughtGroups: { some: { id: { in: gIds } } } },
          ],
        },
        select: { id: true },
      });
      const uIds = users.map((u) => u.id);

      // 4. Bolalar va faoliyat jadvallarini o'chirish
      await tx.leadActivity.deleteMany({
        where: { OR: [{ lead: { centerId: id } }, { userId: { in: uIds } }] },
      });
      await tx.lead.deleteMany({
        where: { OR: [{ centerId: id }, { branchId: { in: bIds } }, { managerId: { in: uIds } }] },
      });

      await tx.submission.deleteMany({
        where: { OR: [{ centerId: id }, { studentId: { in: uIds } }, { homework: { groupId: { in: gIds } } }] },
      });
      await tx.result.deleteMany({
        where: { OR: [{ centerId: id }, { studentId: { in: uIds } }, { test: { groupId: { in: gIds } } }] },
      });
      await tx.attendance.deleteMany({
        where: { OR: [{ centerId: id }, { groupId: { in: gIds } }, { teacherId: { in: uIds } }] },
      });
      await tx.homework.deleteMany({
        where: { OR: [{ centerId: id }, { groupId: { in: gIds } }, { teacherId: { in: uIds } }] },
      });
      await tx.test.deleteMany({
        where: { OR: [{ centerId: id }, { groupId: { in: gIds } }, { teacherId: { in: uIds } }] },
      });
      await tx.lesson.deleteMany({
        where: { OR: [{ centerId: id }, { groupId: { in: gIds } }, { teacherId: { in: uIds } }] },
      });

      await tx.payment.deleteMany({
        where: { OR: [{ centerId: id }, { branchId: { in: bIds } }, { studentId: { in: uIds } }] },
      });
      await tx.expense.deleteMany({
        where: { OR: [{ centerId: id }, { branchId: { in: bIds } }, { createdById: { in: uIds } }] },
      });

      await tx.aIChat.deleteMany({
        where: { OR: [{ centerId: id }, { studentId: { in: uIds } }] },
      });
      await tx.aIAgent.deleteMany({ where: { centerId: id } });
      await tx.notification.deleteMany({
        where: { OR: [{ centerId: id }, { userId: { in: uIds } }] },
      });
      await tx.resource.deleteMany({
        where: { OR: [{ centerId: id }, { groupId: { in: gIds } }, { teacherId: { in: uIds } }] },
      });
      await tx.uploadedFile.deleteMany({ where: { centerId: id } });
      await tx.room.deleteMany({
        where: { OR: [{ centerId: id }, { branchId: { in: bIds } }] },
      });

      // 5. Foreign key zanjirlarini ajratish
      if (uIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: uIds } },
          data: {
            teacherId: null,
            groupId: null,
            branchId: null,
            centerId: null,
            isActive: false,
            refreshTokenHash: null,
          },
        });
      }
      if (gIds.length > 0) {
        await tx.group.updateMany({
          where: { id: { in: gIds } },
          data: { branchId: null, centerId: null },
        });
      }
      if (bIds.length > 0) {
        await tx.branch.updateMany({
          where: { id: { in: bIds } },
          data: { managerId: null, receptionId: null, centerId: null },
        });
      }

      // 6. Guruhlar, filiallar, foydalanuvchilar va markazni to'liq o'chirish
      if (gIds.length > 0) await tx.group.deleteMany({ where: { id: { in: gIds } } });
      if (bIds.length > 0) await tx.branch.deleteMany({ where: { id: { in: bIds } } });
      if (uIds.length > 0) await tx.user.deleteMany({ where: { id: { in: uIds } } });
      await tx.center.delete({ where: { id } });
    });

    cache.flushAll();
    cleanupOrphanedRecords().catch(() => {});

    return success(res, null, 'O\'quv markaz va unga tegishli barcha foydalanuvchilar muvaffaqiyatli o\'chirildi');
  } catch (err) {
    next(err);
  }
};

// GET /admin/centers/:id
const getCenterDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const center = await prisma.center.findUnique({
      where: { id },
      include: {
        branches: {
          where: { isActive: true },
          include: {
            manager: { select: { id: true, name: true, phone: true } },
            _count: { select: { groups: true, teachers: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        users: {
          where: { role: 'manager', isActive: true },
          select: { id: true, name: true, username: true, phone: true, createdAt: true },
        },
        _count: {
          select: {
            users: true,
            groups: true,
            branches: true,
            leads: true,
            payments: true,
          },
        },
      },
    });

    if (!center) return error(res, 'O\'quv markaz topilmadi', 404);

    const [studentsCount, teachersCount, branchesCount, groupsCount] = await Promise.all([
      prisma.user.count({ where: { role: 'student', centerId: id, isActive: true } }),
      prisma.user.count({ where: { role: 'teacher', centerId: id, isActive: true } }),
      prisma.branch.count({ where: { centerId: id, isActive: true } }),
      prisma.group.count({ where: { centerId: id, isActive: true } }),
    ]);

    return success(res, {
      ...center,
      managers: center.users, // alias for frontend compatibility
      _count: {
        ...center._count,
        students: studentsCount,
        teachers: teachersCount,
        branches: branchesCount,
        groups: groupsCount,
      },
      studentsCount,
      teachersCount,
      branchesCount,
      groupsCount,
    });
  } catch (err) {
    next(err);
  }
};

// POST /admin/centers/:id/cleanup-branches and POST /admin/branches/cleanup-empty
const cleanupEmptyBranches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = id ? { centerId: id } : {};
    
    // Find all branches matching scope
    const branches = await prisma.branch.findMany({
      where,
      include: {
        _count: {
          select: {
            groups: true,
            rooms: true,
            teachers: true,
            leads: true,
            expenses: true,
            payments: true,
          },
        },
      },
    });

    // An empty branch has 0 groups, 0 rooms, 0 teachers, 0 leads, 0 expenses, 0 payments
    // or is inactive (soft-deleted)
    const emptyBranches = branches.filter((b) => {
      const totalRelations = (b._count?.groups || 0) +
        (b._count?.rooms || 0) +
        (b._count?.teachers || 0) +
        (b._count?.leads || 0) +
        (b._count?.expenses || 0) +
        (b._count?.payments || 0);
      return !b.isActive || totalRelations === 0;
    });

    if (emptyBranches.length === 0) {
      return success(res, { deletedCount: 0 }, 'Tozalanadigan bo\'sh filiallar topilmadi');
    }

    let toDeleteIds = emptyBranches.map((b) => b.id);
    // If all branches are empty, keep at least 1 primary active branch
    if (branches.length > 0 && emptyBranches.length === branches.length) {
      const keepBranch = branches.find((b) => b.isActive) || branches[0];
      toDeleteIds = toDeleteIds.filter((bid) => bid !== keepBranch.id);
      await prisma.branch.update({
        where: { id: keepBranch.id },
        data: { isActive: true },
      });
    }

    if (toDeleteIds.length === 0) {
      return success(res, { deletedCount: 0 }, 'Tozalanadigan ortiqcha filiallar topilmadi');
    }

    const deleted = await prisma.branch.deleteMany({
      where: { id: { in: toDeleteIds } },
    });

    return success(res, { deletedCount: deleted.count }, `${deleted.count} ta bo'sh yoki nofaol filial muvaffaqiyatli tozalandi`);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCenters,
  getCenterDetail,
  createCenter,
  updateCenter,
  deleteCenter,
  cleanupEmptyBranches,
};

