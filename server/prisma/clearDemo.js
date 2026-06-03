const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning demo data...');
  
  // 1. Delete all payments, expenses, investments, fixed assets
  const payments = await prisma.payment.deleteMany();
  const expenses = await prisma.expense.deleteMany();
  const investments = await prisma.investment.deleteMany();
  const assets = await prisma.fixedAsset.deleteMany();
  
  console.log(`Deleted: ${payments.count} payments, ${expenses.count} expenses, ${investments.count} investments, ${assets.count} fixed assets.`);

  // 2. Delete all users except Super Admin
  const users = await prisma.user.deleteMany({
    where: {
      role: {
        not: 'SUPER_ADMIN'
      }
    }
  });
  
  console.log(`Deleted ${users.count} demo users.`);
  console.log('✅ All demo data removed successfully. Only Super Admin remains.');
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
