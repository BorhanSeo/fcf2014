const express = require('express');
const {
  getBalanceSheet, getIncomeExpenditure, getReceiptPayment,
  getFixedAssetsSchedule, getUserPnL, getAllUsersPnL, getAdminDashboard,
} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkVisibility = require('../middleware/visibilityMiddleware');

const router = express.Router();

// Admin-only endpoints
router.get('/admin-dashboard', authMiddleware, adminMiddleware, getAdminDashboard);
router.get('/user-pnl/all', authMiddleware, adminMiddleware, getAllUsersPnL);

// Settings-controlled endpoints
router.get('/balance-sheet', authMiddleware, checkVisibility('user_view_reports'), getBalanceSheet);
router.get('/income-expenditure', authMiddleware, checkVisibility('user_view_reports'), getIncomeExpenditure);
router.get('/receipt-payment', authMiddleware, checkVisibility('user_view_reports'), getReceiptPayment);
router.get('/fixed-assets', authMiddleware, checkVisibility('user_view_reports'), getFixedAssetsSchedule);

// User PnL endpoint: accessible to admin, own user, or if general reports visibility is enabled
router.get('/user-pnl/:userId', authMiddleware, async (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN' || req.user.id === req.params.userId) {
    return next();
  }
  return checkVisibility('user_view_reports')(req, res, next);
}, getUserPnL);

module.exports = router;
