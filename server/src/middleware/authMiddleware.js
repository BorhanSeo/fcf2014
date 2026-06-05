const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * In-memory user cache — avoids hitting DB on every single API request.
 * TTL = 5 minutes. Invalidated on user update/toggle.
 * This is the BIGGEST performance bottleneck: every API call was doing a full DB round-trip.
 */
const userCache = new Map();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedUser(id) {
  const entry = userCache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    userCache.delete(id);
    return null;
  }
  return entry.data;
}

function setCachedUser(id, data) {
  userCache.set(id, { data, expiry: Date.now() + USER_CACHE_TTL });
}

function invalidateUserCache(id) {
  if (id) {
    userCache.delete(id);
  } else {
    userCache.clear();
  }
}

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

    // Try cache first — avoids DB hit on every API call
    let user = getCachedUser(decoded.id);

    if (!user) {
      user = await prisma.user.findUnique({
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

      if (user) {
        setCachedUser(decoded.id, user);
      }
    }

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
module.exports.invalidateUserCache = invalidateUserCache;
