const prisma = require('./prisma');
const cache = require('./cache');

/**
 * Report Calculators — Financial statement logic (OPTIMIZED)
 * সব statement monthly ও yearly উভয়ভাবে calculate হবে
 * 
 * OPTIMIZATION: getGlobalFinancialTotals() computes all global sums ONCE.
 * calculateUserPnLFast() accepts these pre-computed totals, eliminating N+1 queries.
 */

// ─── Helper: Date range by period ──────────────────────────────
function getDateRange(period, year, month) {
  if (period === 'monthly') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (period === 'all-time') {
    const start = new Date(2000, 0, 1);
    const end = new Date(2100, 11, 31, 23, 59, 59, 999);
    return { start, end };
  }
  // yearly
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
}

// ─── Helper: Payment Filter by Target Month/Year ────────────────
function getPaymentFilter(period, year, month, type) {
  const m = month || 12;
  if (period === 'all-time') return {};
  if (type === 'lte') {
    if (period === 'monthly') return { OR: [{ year: { lt: year } }, { year: year, month: { lte: m } }] };
    return { year: { lte: year } };
  }
  if (type === 'lt') {
    if (period === 'monthly') return { OR: [{ year: { lt: year } }, { year: year, month: { lt: m } }] };
    return { year: { lt: year } };
  }
  if (type === 'exact') {
    if (period === 'monthly') return { year: year, month: m };
    return { year: year };
  }
  return {};
}

// ─── NEW: Compute all global financial totals ONCE ──────────────
// Used by getAllUsers to avoid N+1 queries.
async function getGlobalFinancialTotals(period, year, month) {
  // Cache this expensive computation (8+ parallel DB queries)
  const cacheKey = `global-totals-${period}-${year}-${month}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const { start, end } = getDateRange(period, year, month || 12);
  const paymentFilter = getPaymentFilter(period, year, month, 'lte');

  const [
    paymentAgg,
    activeUsersCount,
    investmentAgg,
    expenseAgg,
    incomeAgg,
    manualProfitsAgg,
    userContributions,
    userManualProfits,
  ] = await Promise.all([
    // Total contributions up to this period
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...paymentFilter, status: 'PAID' } }),
    // Active users count
    prisma.user.count({ where: { isActive: true } }),
    // Investments in period (for income calculation)
    prisma.investment.findMany({ where: { date: { gte: start, lte: end } }, select: { returnAmount: true } }),
    // Expenses in period
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    // General incomes in period
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    // Manual profits in period
    prisma.userProfit.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    // Per-user contribution totals (groupBy) — for proportional share calculation
    prisma.payment.groupBy({
      by: ['userId'],
      where: { ...paymentFilter, status: 'PAID' },
      _sum: { amount: true },
    }),
    // Per-user manual profits in period
    prisma.userProfit.groupBy({
      by: ['userId'],
      where: { date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalContributions = paymentAgg._sum.amount || 0;
  const totalExpenses = expenseAgg._sum.amount || 0;
  const totalGeneralIncome = incomeAgg._sum.amount || 0;
  const totalManualProfit = manualProfitsAgg._sum.amount || 0;
  const investmentReturnAmount = investmentAgg.reduce((s, i) => s + i.returnAmount, 0);
  const totalIncome = investmentReturnAmount + totalGeneralIncome + totalManualProfit;

  // Fixed assets for depreciation
  const fixedAssets = await prisma.fixedAsset.findMany({
    where: { purchaseDate: { lte: end }, isDisposed: false },
    select: { purchaseValue: true, depreciationRate: true },
  });
  const periodMonths = period === 'monthly' ? 1 : (period === 'all-time' ? 300 : 12);
  const depreciation = fixedAssets.reduce((sum, asset) => {
    return sum + (asset.purchaseValue * (asset.depreciationRate / 100) * (periodMonths / 12));
  }, 0);

  // Build lookup maps for per-user data
  const userContribMap = {};
  userContributions.forEach(row => {
    userContribMap[row.userId] = row._sum.amount || 0;
  });

  const userManualProfitMap = {};
  userManualProfits.forEach(row => {
    userManualProfitMap[row.userId] = row._sum.amount || 0;
  });

  const result = {
    totalContributions,
    totalIncome,
    totalExpenses,
    depreciation,
    activeUsersCount,
    userContribMap,
    userManualProfitMap,
    totalManualProfit,
  };

  cache.set(cacheKey, result, 120000); // 2 min cache
  return result;
}

// ─── Fast per-user P&L using pre-computed global totals ─────────
function calculateUserPnLFast(userId, globalTotals) {
  const {
    totalContributions,
    totalIncome,
    totalExpenses,
    depreciation,
    activeUsersCount,
    userContribMap,
    userManualProfitMap,
    totalManualProfit = 0,
  } = globalTotals;

  const userContribution = userContribMap[userId] || 0;
  const manualProfit = userManualProfitMap[userId] || 0;

  const sharePercentage = totalContributions > 0 ? (userContribution / totalContributions) * 100 : 0;
  const distributableIncome = totalIncome - totalManualProfit;
  const autoProfitLoss = activeUsersCount > 0 ? distributableIncome / activeUsersCount : 0;


  const userExpenseShare = activeUsersCount > 0 ? totalExpenses / activeUsersCount : 0;
  const netProfitLoss = totalIncome - totalExpenses - depreciation;
  const userProfitLoss = autoProfitLoss + manualProfit;

  return {
    userId,
    userContribution,
    totalContributions,
    sharePercentage,
    totalIncome,
    totalExpenses,
    activeUsersCount,
    userExpenseShare,
    netProfitLoss,
    autoProfitLoss,
    manualProfit,
    userProfitLoss,
  };
}

// ─── Balance Sheet ──────────────────────────────────────────────
async function calculateBalanceSheet(period, year, month) {
  const { end } = getDateRange(period, year, month || 12);
  const paymentFilter = getPaymentFilter(period, year, month, 'lte');

  // Run all queries in parallel
  const [
    fixedAssets,
    investments,
    paymentAgg,
    manualProfitsAgg,
    incomesAgg,
    expensesAgg,
  ] = await Promise.all([
    prisma.fixedAsset.findMany({ where: { purchaseDate: { lte: end } } }),
    prisma.investment.findMany({ where: { date: { lte: end } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...paymentFilter, status: 'PAID' } }),
    prisma.userProfit.aggregate({ _sum: { amount: true }, where: { date: { lte: end } } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: { lte: end } } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { lte: end } } }),
  ]);

  let totalFixedAssetValue = 0;
  let totalDepreciation = 0;
  fixedAssets.forEach((asset) => {
    if (!asset.isDisposed || (asset.disposalDate && asset.disposalDate > end)) {
      totalFixedAssetValue += asset.purchaseValue;
      const yearsHeld = (end.getTime() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const depreciation = asset.purchaseValue * (asset.depreciationRate / 100) * yearsHeld;
      totalDepreciation += Math.min(depreciation, asset.purchaseValue);
    }
  });
  const netFixedAssets = totalFixedAssetValue - totalDepreciation;

  const totalInvestments = investments.filter(inv => inv.status === 'ACTIVE').reduce((sum, inv) => sum + inv.amount, 0);
  const membersFund = paymentAgg._sum.amount || 0;
  const totalManualProfit = manualProfitsAgg._sum.amount || 0;
  const totalGeneralIncome = incomesAgg._sum.amount || 0;
  const totalIncome = investments.reduce((sum, inv) => sum + inv.returnAmount, 0) + totalManualProfit + totalGeneralIncome;
  const totalExpenses = expensesAgg._sum.amount || 0;
  const retainedSurplus = totalIncome - totalExpenses - totalDepreciation;
  const cashBalance = membersFund + totalIncome - totalInvestments - totalExpenses - totalFixedAssetValue;

  return {
    assets: {
      fixedAssets: totalFixedAssetValue,
      accumulatedDepreciation: totalDepreciation,
      netFixedAssets,
      investments: totalInvestments,
      currentAssets: {
        cashInHand: Math.max(0, cashBalance),
        cashAtBank: 0,
        receivables: 0,
      },
      totalAssets: netFixedAssets + totalInvestments + Math.max(0, cashBalance),
    },
    liabilitiesAndEquity: {
      membersFund,
      retainedSurplus,
      totalEquity: membersFund + retainedSurplus,
      currentLiabilities: { payables: 0 },
      totalLiabilities: 0,
      totalLiabilitiesAndEquity: membersFund + retainedSurplus,
    },
    cumulative: { totalIncome, totalExpenses, totalDepreciation },
    period: { type: period, year, month },
  };
}

// ─── Income & Expenditure Statement ─────────────────────────────
async function calculateIncomeExpenditure(period, year, month) {
  const { start, end } = getDateRange(period, year, month || 12);

  const [investments, manualProfits, generalIncomes, expenses, fixedAssets] = await Promise.all([
    prisma.investment.findMany({ where: { date: { lte: end } }, select: { returnAmount: true, date: true } }),
    prisma.userProfit.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    prisma.income.findMany({ where: { date: { gte: start, lte: end } }, select: { amount: true, category: true } }),
    prisma.expense.findMany({ where: { date: { gte: start, lte: end } }, select: { amount: true, category: true } }),
    prisma.fixedAsset.findMany({ where: { purchaseDate: { lte: end }, isDisposed: false }, select: { purchaseValue: true, depreciationRate: true } }),
  ]);

  const investmentReturns = investments.filter(inv => inv.date >= start && inv.date <= end).reduce((sum, inv) => sum + inv.returnAmount, 0);
  const totalManualProfit = manualProfits._sum.amount || 0;
  const profitFromVentures = generalIncomes.filter(i => i.category === 'Business').reduce((s, i) => s + i.amount, 0);
  const interestIncome = generalIncomes.filter(i => i.category === 'Interest').reduce((s, i) => s + i.amount, 0);
  const otherIncomeBase = generalIncomes.filter(i => i.category !== 'Business' && i.category !== 'Interest').reduce((s, i) => s + i.amount, 0);
  const totalIncome = investmentReturns + totalManualProfit + profitFromVentures + interestIncome + otherIncomeBase;

  const expenseByCategory = {};
  expenses.forEach((e) => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
  const totalExpenditure = expenses.reduce((sum, e) => sum + e.amount, 0);

  const periodMonths = period === 'monthly' ? 1 : 12;
  const depreciationForPeriod = fixedAssets.reduce((sum, asset) => {
    return sum + (asset.purchaseValue * (asset.depreciationRate / 100) * (periodMonths / 12));
  }, 0);

  return {
    income: {
      investmentReturns, profitFromVentures, interestIncome,
      otherIncome: totalManualProfit + otherIncomeBase,
      totalIncome,
    },
    expenditure: {
      categories: expenseByCategory,
      depreciationOnAssets: depreciationForPeriod,
      totalExpenditure: totalExpenditure + depreciationForPeriod,
    },
    netSurplusDeficit: totalIncome - totalExpenditure - depreciationForPeriod,
    period: { type: period, year, month },
  };
}

// ─── Receipt & Payment Statement ─────────────────────────────
async function calculateReceiptPayment(period, year, month) {
  const { start, end } = getDateRange(period, year, month || 12);
  const beforeFilter = getPaymentFilter(period, year, month, 'lt');
  const exactFilter = getPaymentFilter(period, year, month, 'exact');

  // Run before-period and in-period queries in parallel
  const [
    paymentsBefore, investmentsBefore, expensesBefore, assetsBefore, incomesBefore,
    paymentsInPeriod, investmentsInPeriod, expensesInPeriod, assetsInPeriod, incomesInPeriod,
  ] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...beforeFilter, status: 'PAID' } }),
    prisma.investment.findMany({ where: { date: { lt: start } }, select: { amount: true, returnAmount: true, status: true } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { lt: start } } }),
    prisma.fixedAsset.aggregate({ _sum: { purchaseValue: true }, where: { purchaseDate: { lt: start } } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: { lt: start } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { ...exactFilter, status: 'PAID' } }),
    prisma.investment.findMany({ where: { date: { gte: start, lte: end } }, select: { amount: true, returnAmount: true, status: true } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
    prisma.fixedAsset.aggregate({ _sum: { purchaseValue: true }, where: { purchaseDate: { gte: start, lte: end } } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: start, lte: end } } }),
  ]);

  const totalContributionsBefore = paymentsBefore._sum.amount || 0;
  const totalInvestmentsBefore = investmentsBefore.reduce((s, i) => s + i.amount, 0);
  const totalReturnsBefore = investmentsBefore.reduce((s, i) => s + i.returnAmount, 0);
  const totalExpensesBefore = expensesBefore._sum.amount || 0;
  const totalAssetsBefore = assetsBefore._sum.purchaseValue || 0;
  const totalOtherReceiptsBefore = incomesBefore._sum.amount || 0;
  const principalReturnedBefore = investmentsBefore.filter(i => i.status === 'CLOSED').reduce((s, i) => s + i.amount, 0);
  const openingBalance = totalContributionsBefore + totalReturnsBefore + principalReturnedBefore + totalOtherReceiptsBefore - totalInvestmentsBefore - totalExpensesBefore - totalAssetsBefore;

  const monthlyContributions = paymentsInPeriod._sum.amount || 0;
  const investmentReturns = investmentsInPeriod.reduce((s, i) => s + i.returnAmount, 0);
  const otherReceiptsInPeriod = incomesInPeriod._sum.amount || 0;
  const investmentsMade = investmentsInPeriod.reduce((s, i) => s + i.amount, 0);
  const expensesPaid = expensesInPeriod._sum.amount || 0;
  const assetPurchases = assetsInPeriod._sum.purchaseValue || 0;
  const principalReturnedInPeriod = investmentsInPeriod.filter(i => i.status === 'CLOSED').reduce((s, i) => s + i.amount, 0);
  const closingBalance = openingBalance + monthlyContributions + investmentReturns + principalReturnedInPeriod + otherReceiptsInPeriod - investmentsMade - expensesPaid - assetPurchases;

  return {
    receipts: {
      openingCashBalance: Math.max(0, openingBalance),
      monthlyContributions, investmentReturns,
      otherReceipts: otherReceiptsInPeriod,
      totalReceipts: openingBalance + monthlyContributions + investmentReturns + principalReturnedInPeriod + otherReceiptsInPeriod,
    },
    payments: {
      investmentsMade, expensesPaid, fixedAssetPurchases: assetPurchases,
      otherPayments: 0,
      closingCashBalance: Math.max(0, closingBalance),
      totalPayments: investmentsMade + expensesPaid + assetPurchases + Math.max(0, closingBalance),
    },
    period: { type: period, year, month },
  };
}

// ─── Fixed Assets Schedule ──────────────────────────────────────
async function calculateFixedAssetsSchedule(period, year, month) {
  const { start, end } = getDateRange(period, year, month || 12);
  const periodMonths = period === 'monthly' ? 1 : 12;
  const allAssets = await prisma.fixedAsset.findMany({ orderBy: { purchaseDate: 'asc' } });

  const schedule = allAssets.map((asset) => {
    const yearsBeforeStart = Math.max(0, (start.getTime() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const depBefore = Math.min(asset.purchaseValue * (asset.depreciationRate / 100) * yearsBeforeStart, asset.purchaseValue);
    const openingValue = asset.purchaseDate < start ? asset.purchaseValue - depBefore : 0;
    const addedDuringPeriod = (asset.purchaseDate >= start && asset.purchaseDate <= end) ? asset.purchaseValue : 0;
    const disposedDuringPeriod = (asset.isDisposed && asset.disposalDate && asset.disposalDate >= start && asset.disposalDate <= end) ? (asset.disposalValue || 0) : 0;
    const depForPeriod = asset.purchaseDate <= end && !asset.isDisposed
      ? asset.purchaseValue * (asset.depreciationRate / 100) * (periodMonths / 12) : 0;
    const closingValue = openingValue + addedDuringPeriod - disposedDuringPeriod - depForPeriod;

    return {
      id: asset.id, name: asset.name,
      openingValue: Math.max(0, openingValue), additions: addedDuringPeriod,
      disposals: disposedDuringPeriod, depreciation: depForPeriod,
      closingValue: Math.max(0, closingValue),
    };
  });

  const totals = schedule.reduce(
    (acc, item) => ({
      openingValue: acc.openingValue + item.openingValue,
      additions: acc.additions + item.additions,
      disposals: acc.disposals + item.disposals,
      depreciation: acc.depreciation + item.depreciation,
      closingValue: acc.closingValue + item.closingValue,
    }),
    { openingValue: 0, additions: 0, disposals: 0, depreciation: 0, closingValue: 0 }
  );

  return { schedule, totals, period: { type: period, year, month } };
}

// ─── Per User P&L (kept for single-user API calls) ──────────────
async function calculateUserPnL(userId, period, year, month) {
  const globalTotals = await getGlobalFinancialTotals(period, year, month);
  return { ...calculateUserPnLFast(userId, globalTotals), period: { type: period, year, month } };
}

// ─── All Users P&L (OPTIMIZED: single pass) ─────────────────────
async function calculateAllUsersPnL(period, year, month) {
  const [users, globalTotals] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    getGlobalFinancialTotals(period, year, month),
  ]);

  return users.map(user => ({
    ...calculateUserPnLFast(user.id, globalTotals),
    userName: user.name,
    period: { type: period, year, month },
  }));
}

module.exports = {
  calculateBalanceSheet,
  calculateIncomeExpenditure,
  calculateReceiptPayment,
  calculateFixedAssetsSchedule,
  calculateUserPnL,
  calculateAllUsersPnL,
  getGlobalFinancialTotals,
  calculateUserPnLFast,
};
