const express = require('express');
const {
  getMyPayments, getUserPayments, createPayment, createBulkPayments,
  updatePayment, deletePayment, getPaymentSummary, getMyDues,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// User routes
router.get('/my', authMiddleware, getMyPayments);
router.get('/my/dues', authMiddleware, getMyDues);

// Admin routes
router.get('/summary', authMiddleware, adminMiddleware, getPaymentSummary);
router.get('/user/:id', authMiddleware, adminMiddleware, getUserPayments);
router.post('/', authMiddleware, adminMiddleware, createPayment);
router.post('/bulk', authMiddleware, adminMiddleware, createBulkPayments);
router.put('/:id', authMiddleware, adminMiddleware, updatePayment);
router.delete('/:id', authMiddleware, adminMiddleware, deletePayment);

module.exports = router;
