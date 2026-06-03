/**
 * Admin role check middleware
 * authMiddleware-এর পরে ব্যবহার করতে হবে
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    return res.status(403).json({ message: 'শুধুমাত্র অ্যাডমিন অ্যাক্সেস করতে পারবেন' });
  }
};

module.exports = adminMiddleware;
