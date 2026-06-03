const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@fcfgroups.com';
  const newPassword = await bcrypt.hash('282065', 12);

  // Find existing admin
  let admin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        email: adminEmail,
        password: newPassword
      }
    });
    console.log(`Admin updated to ${adminEmail}`);
  } else {
    console.log('Admin not found!');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
