const express = require('express');
const {
  getMyPayments, getUserPayments, createPayment, createBulkPayments,
  updatePayment, deletePayment, getPaymentSummary, getMyDues,
  submitPayment, approvePayment, rejectPayment, getPendingPayments
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// User routes
router.get('/my', authMiddleware, getMyPayments);
router.get('/my/dues', authMiddleware, getMyDues);
router.post('/submit', authMiddleware, submitPayment);

// Admin routes
router.get('/summary', authMiddleware, adminMiddleware, getPaymentSummary);
router.get('/pending', authMiddleware, adminMiddleware, getPendingPayments);
router.get('/user/:id', authMiddleware, adminMiddleware, getUserPayments);
router.post('/', authMiddleware, adminMiddleware, createPayment);
router.post('/bulk', authMiddleware, adminMiddleware, createBulkPayments);
router.post('/:id/approve', authMiddleware, adminMiddleware, approvePayment);
router.post('/:id/reject', authMiddleware, adminMiddleware, rejectPayment);
router.put('/:id', authMiddleware, adminMiddleware, updatePayment);
router.delete('/:id', authMiddleware, adminMiddleware, deletePayment);

module.exports = router;
