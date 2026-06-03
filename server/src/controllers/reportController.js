const {
  calculateBalanceSheet, calculateIncomeExpenditure, calculateReceiptPayment,
  calculateFixedAssetsSchedule, calculateUserPnL, calculateAllUsersPnL,
} = require('../utils/reportCalculators');

function parsePeriodParams(query) {
  const period = query.period || 'yearly';
  const year = parseInt(query.year) || new Date().getFullYear();
  const month = query.month ? parseInt(query.month) : null;
  return { period, year, month };
}

const getBalanceSheet = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const data = await calculateBalanceSheet(period, year, month);
    res.json(data);
  } catch (error) {
    console.error('BalanceSheet error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getIncomeExpenditure = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const data = await calculateIncomeExpenditure(period, year, month);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getReceiptPayment = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const data = await calculateReceiptPayment(period, year, month);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

const getFixedAssetsSchedule = async (req, res) => {
  try {
    const { period, year, month } = parsePeriodParams(req.query);
    const data = await calculateFixedAssetsSchedule(period, year, month);
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

module.exports = { getBalanceSheet, getIncomeExpenditure, getReceiptPayment, getFixedAssetsSchedule, getUserPnL, getAllUsersPnL };
