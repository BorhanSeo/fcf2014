const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkVisibility = require('../middleware/visibilityMiddleware');
const { getAllIncomes, createIncome, deleteIncome } = require('../controllers/incomeController');

const router = express.Router();

// GET list: checked by visibility setting
router.get('/', authMiddleware, checkVisibility('user_view_incomes'), getAllIncomes);

// Write operations: admin only
router.post('/', authMiddleware, adminMiddleware, createIncome);
router.delete('/:id', authMiddleware, adminMiddleware, deleteIncome);

module.exports = router;
