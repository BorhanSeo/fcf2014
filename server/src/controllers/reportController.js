const {
  calculateBalanceSheet, calculateIncomeExpenditure, calculateReceiptPayment,
  calculateFixedAssetsSchedule, calculateUserPnL, calculateAllUsersPnL,
  getGlobalFinancialTotals, calculateUserPnLFast,
} = require('../utils/reportCalculators');
const cache = require('../utils/cache');
const prisma = require('../utils/prisma');

function parsePeriodParams(query) {
  const period = query.period || 'yearly';
  const year = parseInt(query.year) || new Date().getFullYear();
  const month = query.month ? parseInt(query.month) : null;
  return { period, year, month };
}

const getBalanceSheet = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const cacheKey = `bs-${period}-${year}-${month}`;
    let data = cache.get(cacheKey);
    if (!data) {
      data = await calculateBalanceSheet(period, year, month);
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (error) {
    console.error('BalanceSheet error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getIncomeExpenditure = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const cacheKey = `ie-${period}-${year}-${month}`;
    let data = cache.get(cacheKey);
    if (!data) {
      data = await calculateIncomeExpenditure(period, year, month);
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getReceiptPayment = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const cacheKey = `rp-${period}-${year}-${month}`;
    let data = cache.get(cacheKey);
    if (!data) {
      data = await calculateReceiptPayment(period, year, month);
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getFixedAssetsSchedule = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const cacheKey = `fa-${period}-${year}-${month}`;
    let data = cache.get(cacheKey);
    if (!data) {
      data = await calculateFixedAssetsSchedule(period, year, month);
      cache.set(cacheKey, data);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getUserPnL = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const data = await calculateUserPnL(req.params.userId, period, year, month);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getAllUsersPnL = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const data = await calculateAllUsersPnL(period, year, month);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// ─── COMBINED Admin Dashboard endpoint ──────────────────────────
// Returns balance sheet + payment summary + user dues in ONE call
const getAdminDashboard = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const cacheKey = `admin-dash-${year}`;
    let cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    // Run ALL queries in parallel — single round trip
    const [balanceSheet, users, globalTotals] = await Promise.all([
      calculateBalanceSheet('yearly', year, null),
      prisma.user.findMany({
        select: {
          id: true, name: true, monthlyAmount: true, joinDate: true, isActive: true,
          payments: {
            where: { status: 'PAID' },
            select: { year: true, month: true, amount: true, status: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      getGlobalFinancialTotals('all-time'),
    ]);

    // Payment summary + dues — computed in memory, zero extra DB calls
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const summary = users.map(u => {
      const totalPaid = u.payments.reduce((s, p) => s + p.amount, 0);
      const pnl = calculateUserPnLFast(u.id, globalTotals);

      // Calculate totalDue
      const joinDate = new Date(u.joinDate);
      let totalDue = 0;
      let startMonth = joinDate.getMonth();
      let startYear = joinDate.getFullYear();
      if (startYear < 2025 || (startYear === 2025 && startMonth < 8)) {
        startYear = 2025; startMonth = 8;
      }
      let current = new Date(startYear, startMonth, 1);
      while (current <= now) {
        const y = current.getFullYear();
        const m = current.getMonth() + 1;
        const paid = u.payments.find(p => p.year === y && p.month === m)?.amount || 0;
        
        // Count all lifetime dues up to the current month
        totalDue += Math.max(0, u.monthlyAmount - paid);
        
        current.setMonth(current.getMonth() + 1);
      }

      return {
        id: u.id, name: u.name, monthlyAmount: u.monthlyAmount,
        joinDate: u.joinDate, totalPaid, paidMonths: u.payments.length,
        payments: u.payments, totalDue,
        totalReceivable: Math.max(0, totalPaid + pnl.userProfitLoss - (pnl.userExpenseShare || 0)),
      };
    });

    const result = { balanceSheet, summary };
    cache.set(cacheKey, result, 60000); // 60 sec cache
    res.json(result);
  } catch (error) {
    console.error('AdminDashboard error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = {
  getBalanceSheet, getIncomeExpenditure, getReceiptPayment,
  getFixedAssetsSchedule, getUserPnL, getAllUsersPnL, getAdminDashboard,
};

