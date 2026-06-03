const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backup() {
  console.log('Backing up data from SQLite...');
  const users = await prisma.user.findMany();
  const payments = await prisma.payment.findMany();
  const investments = await prisma.investment.findMany();
  const expenses = await prisma.expense.findMany();
  const fixedAssets = await prisma.fixedAsset.findMany();
  const userProfits = await prisma.userProfit.findMany();
  const incomes = await prisma.income.findMany();

  const data = {
    users,
    payments,
    investments,
    expenses,
    fixedAssets,
    userProfits,
    incomes,
  };

  fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
  console.log('Backup saved to backup.json successfully!');
  await prisma.$disconnect();
}

backup().catch(console.error);
