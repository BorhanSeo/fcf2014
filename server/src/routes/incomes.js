const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { getAllIncomes, createIncome, deleteIncome } = require('../controllers/incomeController');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.route('/')
  .get(getAllIncomes)
  .post(createIncome);

router.route('/:id')
  .delete(deleteIncome);

module.exports = router;
