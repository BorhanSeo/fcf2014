const express = require('express');
const { getAllAssets, createAsset, updateAsset } = require('../controllers/assetController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get('/', getAllAssets);
router.post('/', createAsset);
router.put('/:id', updateAsset);

module.exports = router;
