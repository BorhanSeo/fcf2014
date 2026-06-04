const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

// Get settings - accessible to any logged-in user
router.get('/', authMiddleware, getSettings);

// Update settings - admin only
router.put('/', authMiddleware, adminMiddleware, updateSettings);

module.exports = router;
