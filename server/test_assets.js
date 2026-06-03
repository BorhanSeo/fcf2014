const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const assets = await prisma.fixedAsset.findMany();
  console.log('Fixed Assets:', assets.map(a => ({ name: a.name, value: a.purchaseValue, isDisposed: a.isDisposed })));
}
main().finally(() => prisma.$disconnect());
