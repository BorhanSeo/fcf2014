const express = require('express');
const { getAllExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkVisibility = require('../middleware/visibilityMiddleware');

const router = express.Router();

// GET list: checked by visibility setting
router.get('/', authMiddleware, checkVisibility('user_view_expenses'), getAllExpenses);

// Write operations: admin only
router.post('/', authMiddleware, adminMiddleware, createExpense);
router.put('/:id', authMiddleware, adminMiddleware, updateExpense);
router.delete('/:id', authMiddleware, adminMiddleware, deleteExpense);

module.exports = router;
