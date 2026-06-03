const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activate() {
  await prisma.user.updateMany({
    where: { role: 'SUPER_ADMIN' },
    data: { isActive: true }
  });
  console.log('Admin account activated');
}

activate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
