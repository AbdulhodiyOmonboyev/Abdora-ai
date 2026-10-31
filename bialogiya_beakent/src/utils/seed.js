require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

let prismaInstance;
try {
  prismaInstance = require('../config/db').prisma;
} catch {
  const { PrismaClient } = require('@prisma/client');
  prismaInstance = new PrismaClient();
}

// Creates/verifies the Super Admin account (admin / admin123).
async function seed(customPrisma) {
  const prisma = customPrisma || prismaInstance;
  console.log('[Seed] Verifying super admin account...');

  const adminHash = await bcrypt.hash('admin123', 12);
  const adminExists = await prisma.user.findFirst({
    where: { OR: [{ username: 'admin' }, { role: 'admin' }] },
  });

  if (adminExists) {
    await prisma.user.update({
      where: { id: adminExists.id },
      data: { role: 'admin', isActive: true, centerId: null },
    });
    console.log('[Seed] Super admin account verified (username:', adminExists.username, ')');
  } else {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        username: 'admin',
        email: 'admin@abdora.uz',
        passwordHash: adminHash,
        role: 'admin',
        centerId: null,
        isActive: true,
      },
    });
    console.log('[Seed] Super admin account created (admin / admin123)');
  }

  // Tozalash: O'quv markaz sifatida adashib yaratilgan dummy 'Abdora AI Center' yoki 'default-center'
  // Chunki Abdora AI — bu SaaS platformasi / tizim egasining hisobi, o'quv markaz emas.
  try {
    const dummyCenters = await prisma.center.findMany({
      where: {
        OR: [
          { id: 'default-center' },
          { id: 'legacy-center' },
          { name: 'Abdora AI Center' },
        ],
      },
      include: {
        _count: { select: { branches: true, users: true } }
      }
    });

    for (const dc of dummyCenters) {
      if (dc._count.branches === 0 && dc._count.users === 0) {
        await prisma.user.updateMany({
          where: { centerId: dc.id, role: 'admin' },
          data: { centerId: null }
        });
        await prisma.subscription.deleteMany({ where: { centerId: dc.id } });
        await prisma.center.delete({ where: { id: dc.id } });
        console.log(`[Seed] Dummy center removed: ${dc.name} (${dc.id})`);
      }
    }
  } catch (err) {
    console.warn('[Seed] Dummy center cleanup warning:', err.message);
  }

  console.log('\n[Seed] Super Admin is ready: admin / admin123\n');
}

if (require.main === module) {
  seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prismaInstance.$disconnect());
}

module.exports = { seed };
