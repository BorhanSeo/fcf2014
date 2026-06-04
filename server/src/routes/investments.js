const express = require('express');
const { getAllInvestments, createInvestment, updateInvestment, deleteInvestment } = require('../controllers/investmentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkVisibility = require('../middleware/visibilityMiddleware');

const router = express.Router();

// GET list: checked by visibility setting
router.get('/', authMiddleware, checkVisibility('user_view_investments'), getAllInvestments);

// Write operations: admin only
router.post('/', authMiddleware, adminMiddleware, createInvestment);
router.put('/:id', authMiddleware, adminMiddleware, updateInvestment);
router.delete('/:id', authMiddleware, adminMiddleware, deleteInvestment);

module.exports = router;
