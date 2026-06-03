const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const payments = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } });
  const expenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const manualProfits = await prisma.userProfit.aggregate({ _sum: { amount: true } });
  const invs = await prisma.investment.findMany();
  
  console.log('Total Paid:', payments._sum.amount);
  console.log('Total Exp:', expenses._sum.amount);
  console.log('Total Manual Profits:', manualProfits._sum.amount);
  
  const totalReturn = invs.reduce((sum, i) => sum + i.returnAmount, 0);
  console.log('Total Inv Returns:', totalReturn);
  
  const totalInvAmt = invs.reduce((sum, i) => sum + i.amount, 0);
  console.log('Total Investments made:', totalInvAmt);
}
main().finally(() => prisma.$disconnect());
