const prisma = require('../utils/prisma');

// GET /api/expenses
const getAllExpenses = async (req, res) => {
  try {
    const { category, year } = req.query;
    const where = {};
    if (category) where.category = category;
    if (year) {
      where.date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }
    const expenses = await prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    res.json({ expenses, total });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { title, amount, date, category, note } = req.body;
    if (!title || !amount || !date || !category) {
      return res.status(400).json({ message: 'শিরোনাম, পরিমাণ, তারিখ ও ক্যাটাগরি আবশ্যক' });
    }
    const expense = await prisma.expense.create({
      data: { title, amount: parseFloat(amount), date: new Date(date), category, note: note || null },
    });
    res.status(201).json({ message: 'খরচ সফলভাবে যোগ হয়েছে', expense });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const { title, amount, date, category, note } = req.body;
    const updateData = {};
    if (title) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date) updateData.date = new Date(date);
    if (category) updateData.category = category;
    if (note !== undefined) updateData.note = note;
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: updateData });
    res.json({ message: 'খরচ আপডেট হয়েছে', expense });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ message: 'খরচ মুছে ফেলা হয়েছে' });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { getAllExpenses, createExpense, updateExpense, deleteExpense };
