require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Creates ONLY the admin account. No demo teacher/student/group/lesson -
// admin creates real teacher accounts from the Admin panel, teachers/
// reception create real student/group data from there. Change the
// password immediately after first login.
async function seed() {
  console.log('🌱 Seeding database...');

  const center = await prisma.center.upsert({
    where: { id: 'default-center' },
    update: {},
    create: { id: 'default-center', name: 'Abdora AI Center' },
  });

  const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (adminExists) {
    console.log('✅ Admin account already exists (username: admin). Nothing to do.');
    return;
  }

  const adminHash = await bcrypt.hash('admin123', 12);

  await prisma.user.create({
    data: { name: 'Super Admin', username: 'admin', email: 'admin@abdora.uz', passwordHash: adminHash, role: 'admin', centerId: center.id },
  });

  console.log('\n✅ Seed completed!');
  console.log('   Admin: admin / admin123');
  console.log('   ⚠️  Change this password after first login.\n');
}

if (require.main === module) {
  seed().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
}

module.exports = { seed };
