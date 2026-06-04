const prisma = require('../utils/prisma');

// GET /api/assets
const getAllAssets = async (req, res) => {
  try {
    const assets = await prisma.fixedAsset.findMany({ orderBy: { purchaseDate: 'desc' } });
    res.json({ assets });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/assets
const createAsset = async (req, res) => {
  try {
    const { name, purchaseValue, purchaseDate, depreciationRate, note } = req.body;
    if (!name || !purchaseValue || !purchaseDate) {
      return res.status(400).json({ message: 'নাম, ক্রয়মূল্য ও তারিখ আবশ্যক' });
    }
    const asset = await prisma.fixedAsset.create({
      data: {
        name, purchaseValue: parseFloat(purchaseValue), purchaseDate: new Date(purchaseDate),
        depreciationRate: parseFloat(depreciationRate || 0), currentValue: parseFloat(purchaseValue),
        note: note || null,
      },
    });
    res.status(201).json({ message: 'সম্পদ সফলভাবে যোগ হয়েছে', asset });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/assets/:id
const updateAsset = async (req, res) => {
  try {
    const { name, purchaseValue, depreciationRate, currentValue, isDisposed, disposalDate, disposalValue, note } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (purchaseValue !== undefined) updateData.purchaseValue = parseFloat(purchaseValue);
    if (depreciationRate !== undefined) updateData.depreciationRate = parseFloat(depreciationRate);
    if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue);
    if (isDisposed !== undefined) updateData.isDisposed = isDisposed;
    if (disposalDate) updateData.disposalDate = new Date(disposalDate);
    if (disposalValue !== undefined) updateData.disposalValue = parseFloat(disposalValue);
    if (note !== undefined) updateData.note = note;
    const asset = await prisma.fixedAsset.update({ where: { id: req.params.id }, data: updateData });
    res.json({ message: 'সম্পদ আপডেট হয়েছে', asset });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { getAllAssets, createAsset, updateAsset };
