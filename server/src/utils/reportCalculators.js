const { PrismaClient } = require('@prisma/client');

/**
 * Report Calculators — Financial statement logic
 * সব statement monthly ও yearly উভয়ভাবে calculate হবে
 */

const prisma = new PrismaClient();

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

// ─── Balance Sheet ──────────────────────────────────────────────
async function calculateBalanceSheet(period, year, month) {
  const { end } = getDateRange(period, year, month || 12);

  // Assets
  const fixedAssets = await prisma.fixedAsset.findMany({
    where: { purchaseDate: { lte: end } },
  });

  let totalFixedAssetValue = 0;
  let totalDepreciation = 0;
  fixedAssets.forEach((asset) => {
    if (!asset.isDisposed || (asset.disposalDate && asset.disposalDate > end)) {
      totalFixedAssetValue += asset.purchaseValue;
      // Simple straight-line depreciation calculation
      const yearsHeld = (end.getTime() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const depreciation = asset.purchaseValue * (asset.depreciationRate / 100) * yearsHeld;
      totalDepreciation += Math.min(depreciation, asset.purchaseValue);
    }
  });
  const netFixedAssets = totalFixedAssetValue - totalDepreciation;

  // Investments (active only)
  const investments = await prisma.investment.findMany({
    where: { date: { lte: end } },
  });
  const totalInvestments = investments
    .filter((inv) => inv.status === 'ACTIVE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Members' Fund (total contributions till date)
  const paymentFilter = getPaymentFilter(period, year, month, 'lte');
  const payments = await prisma.payment.findMany({
    where: { ...paymentFilter, status: 'PAID' },
  });
  const membersFund = payments.reduce((sum, p) => sum + p.amount, 0);

  // Income till date (Investment returns + Manual Profits)
  const manualProfits = await prisma.userProfit.findMany({
    where: { date: { lte: end } }
  });
  const totalManualProfit = manualProfits.reduce((sum, p) => sum + p.amount, 0);
  
  const incomes = await prisma.income.findMany({
    where: { date: { lte: end } }
  });
  const totalGeneralIncome = incomes.reduce((s, i) => s + i.amount, 0);

  const totalIncome = investments.reduce((sum, inv) => sum + inv.returnAmount, 0) + totalManualProfit + totalGeneralIncome;

  // Expenses till date
  const expenses = await prisma.expense.findMany({
    where: { date: { lte: end } },
  });
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Retained Surplus / Deficit (Must match Income & Expenditure)
  const retainedSurplus = totalIncome - totalExpenses - totalDepreciation;

  // Cash = Members Fund + Income - Investments - Expenses - Fixed Assets
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
      currentLiabilities: {
        payables: 0,
      },
      totalLiabilities: 0,
      totalLiabilitiesAndEquity: membersFund + retainedSurplus,
    },
    cumulative: {
      totalIncome,
      totalExpenses,
      totalDepreciation
    },
    period: { type: period, year, month },
  };
}

// ─── Income & Expenditure Statement ─────────────────────────────
async function calculateIncomeExpenditure(period, year, month) {
  const { start, end } = getDateRange(period, year, month || 12);

  // Income
  const investments = await prisma.investment.findMany({
    where: { date: { lte: end } },
  });

  // Filter returns received within the period (approximation)
  const investmentReturns = investments
    .filter((inv) => inv.date >= start && inv.date <= end)
    .reduce((sum, inv) => sum + inv.returnAmount, 0);

  const manualProfits = await prisma.userProfit.findMany({
    where: { date: { gte: start, lte: end } }
  });
  const totalManualProfit = manualProfits.reduce((sum, p) => sum + p.amount, 0);

  const generalIncomes = await prisma.income.findMany({
    where: { date: { gte: start, lte: end } }
  });
  const profitFromVentures = generalIncomes.filter(i => i.category === 'Business').reduce((s, i) => s + i.amount, 0);
  const interestIncome = generalIncomes.filter(i => i.category === 'Interest').reduce((s, i) => s + i.amount, 0);
  const otherIncomeBase = generalIncomes.filter(i => i.category !== 'Business' && i.category !== 'Interest').reduce((s, i) => s + i.amount, 0);

  const totalIncome = investmentReturns + totalManualProfit + profitFromVentures + interestIncome + otherIncomeBase;

  // Expenditure
  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
  });

  const expenseByCategory = {};
  expenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  const totalExpenditure = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Depreciation for period
  const fixedAssets = await prisma.fixedAsset.findMany({
    where: { purchaseDate: { lte: end }, isDisposed: false },
  });
  const periodMonths = period === 'monthly' ? 1 : 12;
  const depreciationForPeriod = fixedAssets.reduce((sum, asset) => {
    return sum + (asset.purchaseValue * (asset.depreciationRate / 100) * (periodMonths / 12));
  }, 0);

  return {
    income: {
      investmentReturns,
      profitFromVentures,
      interestIncome,
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

  // Opening cash — calculate everything before start
  const beforeFilter = getPaymentFilter(period, year, month, 'lt');
  const paymentsBefore = await prisma.payment.findMany({
    where: { ...beforeFilter, status: 'PAID' },
  });
  const investmentsBefore = await prisma.investment.findMany({
    where: { date: { lt: start } },
  });
  const expensesBefore = await prisma.expense.findMany({
    where: { date: { lt: start } },
  });
  const assetsBefore = await prisma.fixedAsset.findMany({
    where: { purchaseDate: { lt: start } },
  });
  const incomesBefore = await prisma.income.findMany({
    where: { date: { lt: start } },
  });

  const totalContributionsBefore = paymentsBefore.reduce((s, p) => s + p.amount, 0);
  const totalInvestmentsBefore = investmentsBefore.reduce((s, i) => s + i.amount, 0);
  const totalReturnsBefore = investmentsBefore.reduce((s, i) => s + i.returnAmount, 0);
  const totalExpensesBefore = expensesBefore.reduce((s, e) => s + e.amount, 0);
  const totalAssetsBefore = assetsBefore.reduce((s, a) => s + a.purchaseValue, 0);
  const totalOtherReceiptsBefore = incomesBefore.reduce((s, i) => s + i.amount, 0);

  const principalReturnedBefore = investmentsBefore
    .filter(i => i.status === 'CLOSED')
    .reduce((s, i) => s + i.amount, 0);

  const openingBalance = totalContributionsBefore + totalReturnsBefore + principalReturnedBefore + totalOtherReceiptsBefore - totalInvestmentsBefore - totalExpensesBefore - totalAssetsBefore;

  // During period
  const exactFilter = getPaymentFilter(period, year, month, 'exact');
  const paymentsInPeriod = await prisma.payment.findMany({
    where: { ...exactFilter, status: 'PAID' },
  });
  const investmentsInPeriod = await prisma.investment.findMany({
    where: { date: { gte: start, lte: end } },
  });
  const expensesInPeriod = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
  });
  const assetsInPeriod = await prisma.fixedAsset.findMany({
    where: { purchaseDate: { gte: start, lte: end } },
  });
  const incomesInPeriod = await prisma.income.findMany({
    where: { date: { gte: start, lte: end } },
  });

  const monthlyContributions = paymentsInPeriod.reduce((s, p) => s + p.amount, 0);
  const investmentReturns = investmentsInPeriod.reduce((s, i) => s + i.returnAmount, 0);
  const otherReceiptsInPeriod = incomesInPeriod.reduce((s, i) => s + i.amount, 0);
  const investmentsMade = investmentsInPeriod.reduce((s, i) => s + i.amount, 0);
  const expensesPaid = expensesInPeriod.reduce((s, e) => s + e.amount, 0);
  const assetPurchases = assetsInPeriod.reduce((s, a) => s + a.purchaseValue, 0);

  // For closed investments, principal is returned (assuming it happens on 'date' since we lack a closedDate field)
  const principalReturnedInPeriod = investmentsInPeriod
    .filter(i => i.status === 'CLOSED')
    .reduce((s, i) => s + i.amount, 0);
    
  const closingBalance = openingBalance + monthlyContributions + investmentReturns + principalReturnedInPeriod + otherReceiptsInPeriod - investmentsMade - expensesPaid - assetPurchases;

  return {
    receipts: {
      openingCashBalance: Math.max(0, openingBalance),
      monthlyContributions,
      investmentReturns,
      otherReceipts: otherReceiptsInPeriod,
      totalReceipts: openingBalance + monthlyContributions + investmentReturns + principalReturnedInPeriod + otherReceiptsInPeriod,
    },
    payments: {
      investmentsMade,
      expensesPaid,
      fixedAssetPurchases: assetPurchases,
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

  const allAssets = await prisma.fixedAsset.findMany({
    orderBy: { purchaseDate: 'asc' },
  });

  const schedule = allAssets.map((asset) => {
    // Opening value (value at start of period)
    const yearsBeforeStart = Math.max(0, (start.getTime() - asset.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    const depBefore = Math.min(asset.purchaseValue * (asset.depreciationRate / 100) * yearsBeforeStart, asset.purchaseValue);
    const openingValue = asset.purchaseDate < start ? asset.purchaseValue - depBefore : 0;

    const addedDuringPeriod = (asset.purchaseDate >= start && asset.purchaseDate <= end) ? asset.purchaseValue : 0;

    const disposedDuringPeriod = (asset.isDisposed && asset.disposalDate && asset.disposalDate >= start && asset.disposalDate <= end) ? (asset.disposalValue || 0) : 0;

    const depForPeriod = asset.purchaseDate <= end && !asset.isDisposed
      ? asset.purchaseValue * (asset.depreciationRate / 100) * (periodMonths / 12)
      : 0;

    const closingValue = openingValue + addedDuringPeriod - disposedDuringPeriod - depForPeriod;

    return {
      id: asset.id,
      name: asset.name,
      openingValue: Math.max(0, openingValue),
      additions: addedDuringPeriod,
      disposals: disposedDuringPeriod,
      depreciation: depForPeriod,
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

// ─── Per User P&L ──────────────────────────────────────────────
async function calculateUserPnL(userId, period, year, month) {
  const { start, end } = getDateRange(period, year, month || 12);

  const activeUsersCount = await prisma.user.count({ where: { isActive: true } });

  const exactFilter = getPaymentFilter(period, year, month, 'exact');
  
  // User's total contribution
  const userPayments = await prisma.payment.findMany({
    where: {
      userId,
      ...exactFilter,
      status: 'PAID',
    },
  });
  const userContribution = userPayments.reduce((s, p) => s + p.amount, 0);

  // All contributions
  const allPayments = await prisma.payment.findMany({
    where: { ...exactFilter, status: 'PAID' },
  });
  const totalContributions = allPayments.reduce((s, p) => s + p.amount, 0);

  // Income & Expenses for the period (same logic as income-expenditure)
  const investments = await prisma.investment.findMany({
    where: { date: { gte: start, lte: end } },
  });
  const generalIncomes = await prisma.income.findMany({
    where: { date: { gte: start, lte: end } }
  });
  const totalIncome = investments.reduce((s, i) => s + i.returnAmount, 0) + generalIncomes.reduce((s, i) => s + i.amount, 0);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: start, lte: end } },
  });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const fixedAssets = await prisma.fixedAsset.findMany({
    where: { purchaseDate: { lte: end }, isDisposed: false },
  });
  const periodMonths = period === 'monthly' ? 1 : 12;
  const depreciation = fixedAssets.reduce((sum, asset) => {
    return sum + (asset.purchaseValue * (asset.depreciationRate / 100) * (periodMonths / 12));
  }, 0);

  const netProfitLoss = totalIncome - totalExpenses - depreciation;

  // Proportional share based on contribution for INCOME only (Gross Profit)
  const sharePercentage = totalContributions > 0 ? (userContribution / totalContributions) * 100 : 0;
  const autoProfitLoss = totalContributions > 0 ? (userContribution / totalContributions) * totalIncome : 0;
  
  // Equal share for EXPENSES
  const userExpenseShare = activeUsersCount > 0 ? totalExpenses / activeUsersCount : 0;

  // Manual profit for the user
  const userProfits = await prisma.userProfit.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
  });
  const manualProfit = userProfits.reduce((s, p) => s + p.amount, 0);

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
    period: { type: period, year, month },
  };
}

// ─── All Users P&L ─────────────────────────────────────────────
async function calculateAllUsersPnL(period, year, month) {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const results = await Promise.all(
    users.map(async (user) => {
      const pnl = await calculateUserPnL(user.id, period, year, month);
      return { ...pnl, userName: user.name };
    })
  );

  return results;
}

module.exports = {
  calculateBalanceSheet,
  calculateIncomeExpenditure,
  calculateReceiptPayment,
  calculateFixedAssetsSchedule,
  calculateUserPnL,
  calculateAllUsersPnL,
};
