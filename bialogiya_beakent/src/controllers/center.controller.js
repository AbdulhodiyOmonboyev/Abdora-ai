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
        subscription: {
          include: { plan: true }
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
      subscription: c.subscription || null,
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

    // 3. Auto-assign plan to new center
    let subscription = null;
    try {
      let targetPlanId = req.body.planId;
      if (!targetPlanId) {
        const defaultPlan = await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { price: 'asc' } });
        targetPlanId = defaultPlan?.id;
      }

      if (targetPlanId) {
        const plan = await prisma.plan.findUnique({ where: { id: targetPlanId } });
        if (plan) {
          const trialDays = req.body.trialDays ? parseInt(req.body.trialDays, 10) : plan.trialDays;
          const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
          subscription = await prisma.subscription.create({
            data: {
              centerId: center.id,
              planId: plan.id,
              status: 'trial',
              trialEndsAt,
              nextDueDate: trialEndsAt,
              paymentMethod: 'manual'
            },
            include: { plan: true }
          });
        }
      }
    } catch (subErr) {
      console.error('Failed to create initial subscription:', subErr.message);
    }
 
    cache.flushAll();
    return success(res, {
      center,
      manager,
      credentials,
      subscription,
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

    // Kaskadli to'liq va xavfsiz o'chirish: leaf-first ketma-ketlikda
    await prisma.$transaction(async (tx) => {
      // 1. Markazning barcha filiallarini olish
      const branches = await tx.branch.findMany({ where: { centerId: id }, select: { id: true } });
      const bIds = branches.map((b) => b.id);

      // 2. Markaz va filiallar guruhlarini olish
      const groups = await tx.group.findMany({
        where: { OR: [{ centerId: id }, ...(bIds.length ? [{ branchId: { in: bIds } }] : [])] },
        select: { id: true },
      });
      const gIds = groups.map((g) => g.id);

      // 3. Markazga tegishli barcha foydalanuvchilar (Super Admindan tashqari)
      const users = await tx.user.findMany({
        where: {
          role: { not: 'admin' },
          OR: [
            { centerId: id },
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(gIds.length ? [{ taughtGroups: { some: { id: { in: gIds } } } }] : []),
          ],
        },
        select: { id: true },
      });
      const uIds = users.map((u) => u.id);

      // 4. Markazning barcha darslarini olish
      const lessons = await tx.lesson.findMany({
        where: {
          OR: [
            { centerId: id },
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const lIds = lessons.map((l) => l.id);

      // 5. Markazning barcha uy vazifalarini olish
      const homeworks = await tx.homework.findMany({
        where: {
          OR: [
            { centerId: id },
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
            ...(lIds.length ? [{ lessonId: { in: lIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const hIds = homeworks.map((h) => h.id);

      // 6. Markazning barcha testlarini olish
      const tests = await tx.test.findMany({
        where: {
          OR: [
            { centerId: id },
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const tIds = tests.map((t) => t.id);

      // 7. Markazning barcha lidlarini olish
      const leads = await tx.lead.findMany({
        where: {
          OR: [
            { centerId: id },
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ managerId: { in: uIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const leadIds = leads.map((l) => l.id);

      // 8. Subscription
      const sub = await tx.subscription.findUnique({
        where: { centerId: id },
        select: { id: true },
      });
      const subId = sub?.id;

      // ───────────────────────────────────────────────────────────
      // BOLALARNI O'CHIRISH (Qat'iy ravishda bog'liq jadvallardan oldin)
      // ───────────────────────────────────────────────────────────

      // 9. AIChat (Darslar va talabalar chatlari) — Lesson va User'dan OLDIN o'chirish!
      await tx.aIChat.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(lIds.length ? [{ lessonId: { in: lIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 10. LessonMedia (Dars media audio/slaydlari) — Lesson'dan OLDIN o'chirish
      if (lIds.length > 0) {
        await tx.lessonMedia.deleteMany({
          where: { lessonId: { in: lIds } },
        });
      }

      // 11. Submissions (Topshiriq javoblari) — Homework va User'dan OLDIN o'chirish
      await tx.submission.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(hIds.length ? [{ homeworkId: { in: hIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 12. Homework (Uy vazifalari) — Lesson va Group'dan OLDIN o'chirish
      await tx.homework.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(hIds.length ? [{ id: { in: hIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
            ...(lIds.length ? [{ lessonId: { in: lIds } }] : []),
          ],
        },
      });

      // 13. Test Results — Test va User'dan OLDIN o'chirish
      await tx.result.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(tIds.length ? [{ testId: { in: tIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 14. Test Questions — Test'dan OLDIN o'chirish
      if (tIds.length > 0) {
        await tx.question.deleteMany({
          where: { testId: { in: tIds } },
        });
      }

      // 15. Tests — Group va User'dan OLDIN o'chirish
      await tx.test.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(tIds.length ? [{ id: { in: tIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 16. Lessons — Endi Lesson ga bog'liq jadvallar (AIChat, LessonMedia, Homework) to'liq yo'q!
      await tx.lesson.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(lIds.length ? [{ id: { in: lIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 17. LeadActivity — Lead va User'dan OLDIN o'chirish
      await tx.leadActivity.deleteMany({
        where: {
          OR: [
            ...(leadIds.length ? [{ leadId: { in: leadIds } }] : []),
            ...(uIds.length ? [{ userId: { in: uIds } }] : []),
          ],
        },
      });

      // 18. Leads — Branch va User'dan OLDIN o'chirish
      await tx.lead.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(leadIds.length ? [{ id: { in: leadIds } }] : []),
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ managerId: { in: uIds } }] : []),
          ],
        },
      });

      // 19. Attendance
      await tx.attendance.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 20. Resource
      await tx.resource.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 21. Payment
      await tx.payment.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 22. Expense
      await tx.expense.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ createdById: { in: uIds } }] : []),
          ],
        },
      });

      // 23. Notification
      await tx.notification.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(uIds.length ? [{ userId: { in: uIds } }] : []),
          ],
        },
      });

      // 24. UploadedFile & AIAgent
      await tx.uploadedFile.deleteMany({ where: { centerId: id } });
      await tx.aIAgent.deleteMany({ where: { centerId: id } });

      // 25. Subscription, Invoices, AI Logs, SMS Logs
      if (subId) {
        await tx.invoice.deleteMany({ where: { subscriptionId: subId } });
        await tx.aIUsageLog.deleteMany({
          where: { OR: [{ centerId: id }, { subscriptionId: subId }] },
        });
        await tx.sMSLog.deleteMany({
          where: { OR: [{ centerId: id }, { subscriptionId: subId }] },
        });
        await tx.subscription.delete({ where: { id: subId } });
      } else {
        await tx.aIUsageLog.deleteMany({ where: { centerId: id } });
        await tx.sMSLog.deleteMany({ where: { centerId: id } });
      }

      // 26. CustomRole
      await tx.customRole.deleteMany({ where: { centerId: id } });

      // ───────────────────────────────────────────────────────────
      // O'ZARO VA SIKLIK BOG'LANISHLARNI BO'SHATISH (Nullify cyclic FKs)
      // ───────────────────────────────────────────────────────────

      // 27. Foydalanuvchilarni tozalash va o'chirishga tayyorlash
      if (uIds.length > 0) {
        // Agar boshqa biror user ushbu o'qituvchilarga teacherId orqali bog'langan bo'lsa, uzish
        await tx.user.updateMany({
          where: { teacherId: { in: uIds } },
          data: { teacherId: null },
        });

        await tx.user.updateMany({
          where: { id: { in: uIds } },
          data: {
            teacherId: null,
            groupId: null,
            branchId: null,
            centerId: null,
            customRoleId: null,
            isActive: false,
            refreshTokenHash: null,
          },
        });
      }

      // 28. Guruh va filial bog'lanishlarini bo'shatish
      if (gIds.length > 0) {
        await tx.group.updateMany({
          where: { id: { in: gIds } },
          data: { roomId: null, branchId: null, centerId: null },
        });
      }
      if (bIds.length > 0) {
        await tx.branch.updateMany({
          where: { id: { in: bIds } },
          data: { managerId: null, receptionId: null, centerId: null },
        });
      }

      // 29. Xonalar (Room)
      await tx.room.deleteMany({
        where: {
          OR: [
            { centerId: id },
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
          ],
        },
      });

      // 30. Guruhlarni o'chirish
      if (gIds.length > 0) {
        await tx.group.deleteMany({ where: { id: { in: gIds } } });
      }

      // 31. Filiallarni o'chirish
      if (bIds.length > 0) {
        await tx.branch.deleteMany({ where: { id: { in: bIds } } });
      }

      // 32. Foydalanuvchilarni o'chirish
      if (uIds.length > 0) {
        await tx.user.deleteMany({ where: { id: { in: uIds } } });
      }

      // 32.5. Super adminlarni markazdan uzish (hech qachon o'chmasligi uchun)
      await tx.user.updateMany({
        where: { centerId: id, role: 'admin' },
        data: { centerId: null },
      });

      // 33. Markazning o'zini o'chirish
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

