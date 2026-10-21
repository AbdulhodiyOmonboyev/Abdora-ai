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
  console.log('[Seed] Verifying super admin and default center...');

  const center = await prisma.center.upsert({
    where: { id: 'default-center' },
    update: {},
    create: { id: 'default-center', name: 'Abdora AI Center' },
  });

  const adminHash = await bcrypt.hash('admin123', 12);
  const adminExists = await prisma.user.findFirst({
    where: { OR: [{ username: 'admin' }, { role: 'admin' }] },
  });

  if (adminExists) {
    if (!adminExists.isActive || adminExists.role !== 'admin') {
      await prisma.user.update({
        where: { id: adminExists.id },
        data: { role: 'admin', isActive: true },
      });
    }
    console.log('[Seed] Admin account verified (username:', adminExists.username, ')');
    return;
  }

  await prisma.user.create({
    data: {
      name: 'Super Admin',
      username: 'admin',
      email: 'admin@abdora.uz',
      passwordHash: adminHash,
      role: 'admin',
      centerId: center.id,
      isActive: true,
    },
  });

  console.log('\n[Seed] Seed completed!');
  console.log('   Admin: admin / admin123\n');
}

if (require.main === module) {
  seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
}

module.exports = { seed };
