const { prisma } = require('../config/db');

/**
 * Multi-tenant yetim (orphaned) ma'lumotlarni tozalash servisi.
 * Agar qaysidir filial, guruh yoki foydalanuvchining markazi bazada yo'q bo'lsa
 * yoki nofaol (isActive = false) bo'lsa, ularni avtomatik tozalaydi.
 */
async function cleanupOrphanedRecords() {
  try {
    const activeCenters = await prisma.center.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const acIds = activeCenters.map(c => c.id);

    // 1. Faol markazga ega bo'lmagan guruhlarni aniqlash
    const orphanedGroups = await prisma.group.findMany({
      where: {
        OR: [
          { centerId: null },
          { centerId: { notIn: acIds.length > 0 ? acIds : ['__none__'] } },
          { center: { isActive: false } },
        ],
      },
      select: { id: true },
    });
    const gIds = orphanedGroups.map(g => g.id);

    // 2. Faol markazga ega bo'lmagan filiallarni aniqlash
    const orphanedBranches = await prisma.branch.findMany({
      where: {
        OR: [
          { centerId: null },
          { centerId: { notIn: acIds.length > 0 ? acIds : ['__none__'] } },
          { center: { isActive: false } },
        ],
      },
      select: { id: true },
    });
    const bIds = orphanedBranches.map(b => b.id);

    // 3. Faol markazga ega bo'lmagan foydalanuvchilarni aniqlash (Super Admindan tashqari)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        role: { not: 'admin' },
        OR: [
          { centerId: null },
          { centerId: { notIn: acIds.length > 0 ? acIds : ['__none__'] } },
          { center: { isActive: false } },
          ...(bIds.length > 0 ? [{ branchId: { in: bIds } }] : []),
          ...(gIds.length > 0 ? [{ groupId: { in: gIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const uIds = orphanedUsers.map(u => u.id);

    if (gIds.length > 0 || bIds.length > 0 || uIds.length > 0) {
      console.log(`[CLEANUP] Found orphaned: ${gIds.length} groups, ${bIds.length} branches, ${uIds.length} users. Purging...`);

      // Aloqador ma'lumotlarni o'chirish
      await prisma.leadActivity.deleteMany({
        where: { OR: [{ userId: { in: uIds } }, { lead: { branchId: { in: bIds } } }] },
      });
      await prisma.lead.deleteMany({
        where: { OR: [{ managerId: { in: uIds } }, { branchId: { in: bIds } }] },
      });
      await prisma.submission.deleteMany({
        where: { OR: [{ studentId: { in: uIds } }, { homework: { groupId: { in: gIds } } }] },
      });
      await prisma.result.deleteMany({
        where: { OR: [{ studentId: { in: uIds } }, { test: { groupId: { in: gIds } } }] },
      });
      await prisma.attendance.deleteMany({
        where: { OR: [{ teacherId: { in: uIds } }, { groupId: { in: gIds } }] },
      });
      await prisma.homework.deleteMany({
        where: { OR: [{ teacherId: { in: uIds } }, { groupId: { in: gIds } }] },
      });
      await prisma.test.deleteMany({
        where: { OR: [{ teacherId: { in: uIds } }, { groupId: { in: gIds } }] },
      });
      await prisma.lesson.deleteMany({
        where: { OR: [{ teacherId: { in: uIds } }, { groupId: { in: gIds } }] },
      });
      await prisma.payment.deleteMany({
        where: { OR: [{ studentId: { in: uIds } }, { branchId: { in: bIds } }] },
      });
      await prisma.expense.deleteMany({
        where: { OR: [{ createdById: { in: uIds } }, { branchId: { in: bIds } }] },
      });
      await prisma.aIChat.deleteMany({
        where: { studentId: { in: uIds } },
      });
      await prisma.notification.deleteMany({
        where: { userId: { in: uIds } },
      });
      await prisma.resource.deleteMany({
        where: { OR: [{ teacherId: { in: uIds } }, { groupId: { in: gIds } }] },
      });
      await prisma.room.deleteMany({
        where: { branchId: { in: bIds } },
      });

      // Bog'lanishlarni bo'shatish
      if (uIds.length > 0) {
        await prisma.user.updateMany({
          where: { id: { in: uIds } },
          data: { teacherId: null, groupId: null, branchId: null, centerId: null, isActive: false, refreshTokenHash: null },
        });
      }
      if (gIds.length > 0) {
        await prisma.group.updateMany({
          where: { id: { in: gIds } },
          data: { branchId: null, centerId: null },
        });
      }
      if (bIds.length > 0) {
        await prisma.branch.updateMany({
          where: { id: { in: bIds } },
          data: { managerId: null, receptionId: null, centerId: null },
        });
      }

      // Tozalash
      if (gIds.length > 0) await prisma.group.deleteMany({ where: { id: { in: gIds } } });
      if (bIds.length > 0) await prisma.branch.deleteMany({ where: { id: { in: bIds } } });
      if (uIds.length > 0) await prisma.user.deleteMany({ where: { id: { in: uIds } } });

      console.log(`[CLEANUP] Successfully purged ${gIds.length} groups, ${bIds.length} branches, ${uIds.length} users.`);
    }
  } catch (err) {
    console.error('[CLEANUP ERROR]:', err.message);
  }
}

module.exports = { cleanupOrphanedRecords };
