const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient — একটাই instance সব controller-এ share হবে
// Vercel serverless-এ এটি cold start কমায় কারণ globalThis-এ cache হয়
const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

module.exports = prisma;
