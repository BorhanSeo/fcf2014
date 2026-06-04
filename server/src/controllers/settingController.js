const prisma = require('../utils/prisma');
const cache = require('../utils/cache');

// Default settings
const DEFAULT_SETTINGS = {
  user_view_investments: 'false',
  user_view_expenses: 'false',
  user_view_incomes: 'false',
  user_view_assets: 'false',
  user_view_reports: 'false',
};

// GET /api/settings - Fetch all settings
const getSettings = async (req, res) => {
  try {
    const dbSettings = await prisma.setting.findMany();
    
    // Convert array of {key, value} to a single object
    const settingsObj = {};
    dbSettings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    // Merge with defaults
    const finalSettings = { ...DEFAULT_SETTINGS, ...settingsObj };
    res.json({ settings: finalSettings });
  } catch (error) {
    console.error('GetSettings error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/settings - Update settings (Admin)
const updateSettings = async (req, res) => {
  try {
    const settings = req.body; // e.g., { user_view_investments: 'true', ... }
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'অবৈধ পে-লোড' });
    }

    // Upsert each setting key-value pair in database
    const promises = Object.entries(settings).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(promises);

    // Invalidate dashboard and all report caches
    cache.invalidateAll();

    res.json({ message: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে' });
  } catch (error) {
    console.error('UpdateSettings error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
