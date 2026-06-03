const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allPaid = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } });
  
  // Total by paidDate <= Dec 31 2026
  const endOf2026 = new Date(2026, 11, 31, 23, 59, 59, 999);
  const byPaidDate = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'PAID', paidDate: { lte: endOf2026 } }
  });
  
  // Total by Target Year <= 2026
  const byTargetYear = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'PAID', year: { lte: 2026 } }
  });
  
  console.log('Total Paid ever:', allPaid._sum.amount);
  console.log('Total Paid by paidDate <= 2026:', byPaidDate._sum.amount);
  console.log('Total Paid by Target Year <= 2026:', byTargetYear._sum.amount);
  
  const manualProfits = await prisma.userProfit.aggregate({ _sum: { amount: true } });
  console.log('Total Manual Profits:', manualProfits._sum.amount);
}
main().finally(() => prisma.$disconnect());
