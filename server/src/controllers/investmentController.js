const prisma = require('../utils/prisma');

// GET /api/investments
const getAllInvestments = async (req, res) => {
  try {
    const investments = await prisma.investment.findMany({
      orderBy: { date: 'desc' },
    });
    res.json({ investments });
  } catch (error) {
    console.error('GetInvestments error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/investments
const createInvestment = async (req, res) => {
  try {
    const { title, amount, date, type, note } = req.body;

    if (!title || !amount || !date) {
      return res.status(400).json({ message: 'শিরোনাম, পরিমাণ ও তারিখ আবশ্যক' });
    }

    const investment = await prisma.investment.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        type: type || null,
        note: note || null,
      },
    });

    res.status(201).json({ message: 'বিনিয়োগ সফলভাবে যোগ হয়েছে', investment });
  } catch (error) {
    console.error('CreateInvestment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/investments/:id
const updateInvestment = async (req, res) => {
  try {
    const { title, amount, date, returnAmount, type, status, note } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date) updateData.date = new Date(date);
    if (returnAmount !== undefined) updateData.returnAmount = parseFloat(returnAmount);
    if (type !== undefined) updateData.type = type;
    if (status) updateData.status = status;
    if (note !== undefined) updateData.note = note;

    const investment = await prisma.investment.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({ message: 'বিনিয়োগ আপডেট হয়েছে', investment });
  } catch (error) {
    console.error('UpdateInvestment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// DELETE /api/investments/:id
const deleteInvestment = async (req, res) => {
  try {
    await prisma.investment.delete({ where: { id: req.params.id } });
    res.json({ message: 'বিনিয়োগ মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('DeleteInvestment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { getAllInvestments, createInvestment, updateInvestment, deleteInvestment };
