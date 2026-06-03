const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profits = await prisma.userProfit.findMany({
    orderBy: { date: 'desc' },
    take: 10
  });
  console.log('Recent manual profits:', profits);
}
main().finally(() => prisma.$disconnect());
