const prisma = require('../utils/prisma');

// GET /api/incomes
const getAllIncomes = async (req, res) => {
  try {
    const incomes = await prisma.income.findMany({
      orderBy: { date: 'desc' },
    });
    res.json({ incomes });
  } catch (error) {
    console.error('GetAllIncomes error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/incomes
const createIncome = async (req, res) => {
  try {
    const { source, amount, date, category, note } = req.body;

    if (!source || !amount || !date || !category) {
      return res.status(400).json({ message: 'উৎস, পরিমাণ, তারিখ এবং ক্যাটাগরি আবশ্যক' });
    }

    const income = await prisma.income.create({
      data: {
        source,
        amount: Number(amount),
        date: new Date(date),
        category,
        note,
      },
    });

    res.status(201).json({ message: 'আয় সফলভাবে এন্ট্রি করা হয়েছে', income });
  } catch (error) {
    console.error('CreateIncome error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// DELETE /api/incomes/:id
const deleteIncome = async (req, res) => {
  try {
    await prisma.income.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'আয় সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('DeleteIncome error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { getAllIncomes, createIncome, deleteIncome };
