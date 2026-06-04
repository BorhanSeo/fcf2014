const express = require('express');
const {
  getBalanceSheet, getIncomeExpenditure, getReceiptPayment,
  getFixedAssetsSchedule, getUserPnL, getAllUsersPnL, getAdminDashboard,
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/admin-dashboard', getAdminDashboard);
router.get('/balance-sheet', getBalanceSheet);
router.get('/income-expenditure', getIncomeExpenditure);
router.get('/receipt-payment', getReceiptPayment);
router.get('/fixed-assets', getFixedAssetsSchedule);
router.get('/user-pnl/all', getAllUsersPnL);
router.get('/user-pnl/:userId', getUserPnL);

module.exports = router;
