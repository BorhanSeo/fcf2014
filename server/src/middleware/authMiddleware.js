const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * JWT Token verify করে এবং req.user এ user info set করে
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'অননুমোদিত অ্যাক্সেস — টোকেন প্রদান করুন' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        joinDate: true,
        monthlyAmount: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'টোকেনের মেয়াদ শেষ — পুনরায় লগইন করুন' });
    }
    return res.status(401).json({ message: 'অবৈধ টোকেন' });
  }
};

module.exports = authMiddleware;
