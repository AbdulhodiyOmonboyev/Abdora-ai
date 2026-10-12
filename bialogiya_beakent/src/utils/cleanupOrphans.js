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

      // Darslar, uy vazifalari, testlar va lidlarni aniqlash
      const lessons = await prisma.lesson.findMany({
        where: {
          OR: [
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const lIds = lessons.map(l => l.id);

      const homeworks = await prisma.homework.findMany({
        where: {
          OR: [
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
            ...(lIds.length ? [{ lessonId: { in: lIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const hIds = homeworks.map(h => h.id);

      const tests = await prisma.test.findMany({
        where: {
          OR: [
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const tIds = tests.map(t => t.id);

      const leads = await prisma.lead.findMany({
        where: {
          OR: [
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ managerId: { in: uIds } }] : []),
          ],
        },
        select: { id: true },
      });
      const leadIds = leads.map(l => l.id);

      // 1. AIChat — Lesson va User'dan OLDIN o'chirilishi SHART
      await prisma.aIChat.deleteMany({
        where: {
          OR: [
            ...(lIds.length ? [{ lessonId: { in: lIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 2. LessonMedia — Lesson'dan OLDIN o'chirish
      if (lIds.length > 0) {
        await prisma.lessonMedia.deleteMany({
          where: { lessonId: { in: lIds } },
        });
      }

      // 3. Submissions — Homework va User'dan OLDIN o'chirish
      await prisma.submission.deleteMany({
        where: {
          OR: [
            ...(hIds.length ? [{ homeworkId: { in: hIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 4. Homework — Lesson va Group'dan OLDIN o'chirish
      await prisma.homework.deleteMany({
        where: {
          OR: [
            ...(hIds.length ? [{ id: { in: hIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
            ...(lIds.length ? [{ lessonId: { in: lIds } }] : []),
          ],
        },
      });

      // 5. Results — Test va User'dan OLDIN o'chirish
      await prisma.result.deleteMany({
        where: {
          OR: [
            ...(tIds.length ? [{ testId: { in: tIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });

      // 6. Questions — Test'dan OLDIN o'chirish
      if (tIds.length > 0) {
        await prisma.question.deleteMany({
          where: { testId: { in: tIds } },
        });
      }

      // 7. Tests — Group va User'dan OLDIN o'chirish
      await prisma.test.deleteMany({
        where: {
          OR: [
            ...(tIds.length ? [{ id: { in: tIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 8. Lessons — Endi Lesson ga hech qanday jadval bog'lanmagan
      await prisma.lesson.deleteMany({
        where: {
          OR: [
            ...(lIds.length ? [{ id: { in: lIds } }] : []),
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 9. LeadActivity — Lead va User'dan OLDIN o'chirish
      await prisma.leadActivity.deleteMany({
        where: {
          OR: [
            ...(leadIds.length ? [{ leadId: { in: leadIds } }] : []),
            ...(uIds.length ? [{ userId: { in: uIds } }] : []),
          ],
        },
      });

      // 10. Leads
      await prisma.lead.deleteMany({
        where: {
          OR: [
            ...(leadIds.length ? [{ id: { in: leadIds } }] : []),
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ managerId: { in: uIds } }] : []),
          ],
        },
      });

      // 11. Attendance
      await prisma.attendance.deleteMany({
        where: {
          OR: [
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 12. Resource
      await prisma.resource.deleteMany({
        where: {
          OR: [
            ...(gIds.length ? [{ groupId: { in: gIds } }] : []),
            ...(uIds.length ? [{ teacherId: { in: uIds } }] : []),
          ],
        },
      });

      // 13. Payment & Expense
      await prisma.payment.deleteMany({
        where: {
          OR: [
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ studentId: { in: uIds } }] : []),
          ],
        },
      });
      await prisma.expense.deleteMany({
        where: {
          OR: [
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
            ...(uIds.length ? [{ createdById: { in: uIds } }] : []),
          ],
        },
      });

      // 14. Notification
      await prisma.notification.deleteMany({
        where: { userId: { in: uIds } },
      });

      // 15. Room
      await prisma.room.deleteMany({
        where: {
          OR: [
            ...(bIds.length ? [{ branchId: { in: bIds } }] : []),
          ],
        },
      });

      // 16. O'zaro va siklik bog'lanishlarni bo'shatish
      if (uIds.length > 0) {
        await prisma.user.updateMany({
          where: { teacherId: { in: uIds } },
          data: { teacherId: null },
        });

        await prisma.user.updateMany({
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
      if (gIds.length > 0) {
        await prisma.group.updateMany({
          where: { id: { in: gIds } },
          data: { roomId: null, branchId: null, centerId: null },
        });
      }
      if (bIds.length > 0) {
        await prisma.branch.updateMany({
          where: { id: { in: bIds } },
          data: { managerId: null, receptionId: null, centerId: null },
        });
      }

      // 17. Guruhlar, filiallar va foydalanuvchilarni o'chirish
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
