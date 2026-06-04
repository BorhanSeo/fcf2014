const prisma = require('../utils/prisma');

const checkVisibility = (settingKey) => {
  return async (req, res, next) => {
    // Admins always have access
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Check if visibility setting is enabled in DB
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: settingKey }
      });

      if (setting && setting.value === 'true') {
        return next();
      }

      return res.status(403).json({ message: 'শুধুমাত্র অ্যাডমিন অ্যাক্সেস করতে পারবেন' });
    } catch (error) {
      console.error('Visibility check error:', error);
      return res.status(500).json({ message: 'সার্ভার এরর' });
    }
  };
};

module.exports = checkVisibility;
