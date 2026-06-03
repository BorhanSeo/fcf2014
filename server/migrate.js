const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const sqliteDb = new Database(path.join(__dirname, 'prisma/dev.db'));
const prisma = new PrismaClient();

async function migrateData() {
  console.log('Starting data migration from SQLite to Supabase PostgreSQL...');

  try {
    // 1. Migrate Users
    const users = sqliteDb.prepare('SELECT * FROM User').all();
    console.log(`Found ${users.length} users. Migrating...`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          password: u.password,
          role: u.role,
          phone: u.phone,
          avatar: u.avatar,
          joinDate: new Date(u.joinDate),
          monthlyAmount: u.monthlyAmount,
          isActive: u.isActive === 1,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt)
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          phone: u.phone,
          avatar: u.avatar,
          joinDate: new Date(u.joinDate),
          monthlyAmount: u.monthlyAmount,
          isActive: u.isActive === 1,
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt)
        }
      });
    }

    // 2. Migrate Payments
    const payments = sqliteDb.prepare('SELECT * FROM Payment').all();
    console.log(`Found ${payments.length} payments. Migrating...`);
    for (const p of payments) {
      await prisma.payment.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          userId: p.userId,
          year: p.year,
          month: p.month,
          amount: p.amount,
          paidDate: new Date(p.paidDate),
          method: p.method,
          note: p.note,
          status: p.status,
          createdAt: new Date(p.createdAt)
        }
      });
    }

    // 3. Migrate Investments
    const investments = sqliteDb.prepare('SELECT * FROM Investment').all();
    console.log(`Found ${investments.length} investments. Migrating...`);
    for (const inv of investments) {
      await prisma.investment.upsert({
        where: { id: inv.id },
        update: {},
        create: {
          id: inv.id,
          title: inv.title,
          amount: inv.amount,
          date: new Date(inv.date),
          returnAmount: inv.returnAmount,
          type: inv.type,
          status: inv.status,
          note: inv.note,
          createdAt: new Date(inv.createdAt)
        }
      });
    }

    // 4. Migrate Expenses
    const expenses = sqliteDb.prepare('SELECT * FROM Expense').all();
    console.log(`Found ${expenses.length} expenses. Migrating...`);
    for (const exp of expenses) {
      await prisma.expense.upsert({
        where: { id: exp.id },
        update: {},
        create: {
          id: exp.id,
          title: exp.title,
          amount: exp.amount,
          date: new Date(exp.date),
          category: exp.category,
          note: exp.note,
          createdAt: new Date(exp.createdAt)
        }
      });
    }

    // 5. Migrate FixedAssets
    const assets = sqliteDb.prepare('SELECT * FROM FixedAsset').all();
    console.log(`Found ${assets.length} assets. Migrating...`);
    for (const a of assets) {
      await prisma.fixedAsset.upsert({
        where: { id: a.id },
        update: {},
        create: {
          id: a.id,
          name: a.name,
          purchaseValue: a.purchaseValue,
          purchaseDate: new Date(a.purchaseDate),
          depreciationRate: a.depreciationRate,
          currentValue: a.currentValue,
          isDisposed: a.isDisposed === 1,
          disposalDate: a.disposalDate ? new Date(a.disposalDate) : null,
          disposalValue: a.disposalValue,
          note: a.note,
          createdAt: new Date(a.createdAt)
        }
      });
    }

    // 6. Migrate UserProfits
    const profits = sqliteDb.prepare('SELECT * FROM UserProfit').all();
    console.log(`Found ${profits.length} profits. Migrating...`);
    for (const p of profits) {
      await prisma.userProfit.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          userId: p.userId,
          amount: p.amount,
          date: new Date(p.date),
          note: p.note,
          createdAt: new Date(p.createdAt)
        }
      });
    }

    // 7. Migrate Incomes
    const incomes = sqliteDb.prepare('SELECT * FROM Income').all();
    console.log(`Found ${incomes.length} incomes. Migrating...`);
    for (const i of incomes) {
      await prisma.income.upsert({
        where: { id: i.id },
        update: {},
        create: {
          id: i.id,
          source: i.source,
          amount: i.amount,
          date: new Date(i.date),
          category: i.category,
          note: i.note,
          createdAt: new Date(i.createdAt)
        }
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqliteDb.close();
    await prisma.$disconnect();
  }
}

migrateData();
