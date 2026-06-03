const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
  console.log('Restoring data from backup.json to Supabase PostgreSQL...');
  
  if (!fs.existsSync('backup.json')) {
    console.error('backup.json not found!');
    return;
  }

  const data = JSON.parse(fs.readFileSync('backup.json', 'utf8'));

  try {
    console.log('Clearing existing data in Supabase...');
    await prisma.payment.deleteMany();
    await prisma.investment.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.fixedAsset.deleteMany();
    await prisma.userProfit.deleteMany();
    await prisma.income.deleteMany();
    await prisma.user.deleteMany();
    
    // 1. Users
    if (data.users && data.users.length > 0) {
      console.log(`Restoring ${data.users.length} users...`);
      const usersData = data.users.map(u => ({
        ...u,
        joinDate: new Date(u.joinDate),
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt)
      }));
      await prisma.user.createMany({ data: usersData });
    }

    // 2. Payments
    if (data.payments && data.payments.length > 0) {
      console.log(`Restoring ${data.payments.length} payments...`);
      const paymentsData = data.payments.map(p => ({
        ...p,
        paidDate: new Date(p.paidDate),
        createdAt: new Date(p.createdAt)
      }));
      await prisma.payment.createMany({ data: paymentsData });
    }

    // 3. Investments
    if (data.investments && data.investments.length > 0) {
      console.log(`Restoring ${data.investments.length} investments...`);
      const investmentsData = data.investments.map(inv => ({
        ...inv,
        date: new Date(inv.date),
        createdAt: new Date(inv.createdAt)
      }));
      await prisma.investment.createMany({ data: investmentsData });
    }

    // 4. Expenses
    if (data.expenses && data.expenses.length > 0) {
      console.log(`Restoring ${data.expenses.length} expenses...`);
      const expensesData = data.expenses.map(exp => ({
        ...exp,
        date: new Date(exp.date),
        createdAt: new Date(exp.createdAt)
      }));
      await prisma.expense.createMany({ data: expensesData });
    }

    // 5. FixedAssets
    if (data.fixedAssets && data.fixedAssets.length > 0) {
      console.log(`Restoring ${data.fixedAssets.length} fixed assets...`);
      const assetsData = data.fixedAssets.map(a => ({
        ...a,
        purchaseDate: new Date(a.purchaseDate),
        disposalDate: a.disposalDate ? new Date(a.disposalDate) : null,
        createdAt: new Date(a.createdAt)
      }));
      await prisma.fixedAsset.createMany({ data: assetsData });
    }

    // 6. UserProfits
    if (data.userProfits && data.userProfits.length > 0) {
      console.log(`Restoring ${data.userProfits.length} user profits...`);
      const profitsData = data.userProfits.map(p => ({
        ...p,
        date: new Date(p.date),
        createdAt: new Date(p.createdAt)
      }));
      await prisma.userProfit.createMany({ data: profitsData });
    }

    // 7. Incomes
    if (data.incomes && data.incomes.length > 0) {
      console.log(`Restoring ${data.incomes.length} incomes...`);
      const incomesData = data.incomes.map(i => ({
        ...i,
        date: new Date(i.date),
        createdAt: new Date(i.createdAt)
      }));
      await prisma.income.createMany({ data: incomesData });
    }

    console.log('Restore completed successfully!');
  } catch (error) {
    console.error('Error during restore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore().catch(console.error);
