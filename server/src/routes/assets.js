const express = require('express');
const { getAllAssets, createAsset, updateAsset } = require('../controllers/assetController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const checkVisibility = require('../middleware/visibilityMiddleware');

const router = express.Router();

// GET list: checked by visibility setting
router.get('/', authMiddleware, checkVisibility('user_view_assets'), getAllAssets);

// Write operations: admin only
router.post('/', authMiddleware, adminMiddleware, createAsset);
router.put('/:id', authMiddleware, adminMiddleware, updateAsset);

module.exports = router;
