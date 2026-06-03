const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@fcf2014.com';
  const plainPassword = '282065';
  
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        name: 'Super Admin',
        email,
        password: hashedPassword,
        phone: '01700000000',
        joinDate: new Date(),
        role: 'ADMIN',
      },
    });
    
    console.log(`Successfully updated/created admin: ${user.email}`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
