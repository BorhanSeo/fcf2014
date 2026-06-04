const express = require('express');
const { getAllUsers, createUser, getUserById, updateUser, toggleUser, getMySummary, getUserSummary, addUserProfit, deleteUserProfit, deleteUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkVisibility = require('../middleware/visibilityMiddleware');

const router = express.Router();

// User specific routes
router.get('/my-summary', authMiddleware, getMySummary);
router.get('/', authMiddleware, checkVisibility('user_view_users'), getAllUsers);

// Admin routes
router.use(authMiddleware, adminMiddleware);

router.post('/', createUser);
router.get('/:id', getUserById);
router.get('/:id/summary', getUserSummary);
router.put('/:id', updateUser);
router.patch('/:id/toggle', toggleUser);
router.post('/:id/profit', addUserProfit);
router.delete('/profit/:profitId', deleteUserProfit);
router.delete('/:id', deleteUser);

module.exports = router;
