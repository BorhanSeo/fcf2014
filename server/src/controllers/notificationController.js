const prisma = require('../utils/prisma');

// GET /api/notifications
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; 

    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    const where = isAdmin 
      ? { OR: [{ userId }, { userId: null }] }
      : { userId };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('GetNotifications error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('MarkAsRead error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    const where = isAdmin 
      ? { OR: [{ userId }, { userId: null }], isRead: false }
      : { userId, isRead: false };

    await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('MarkAllAsRead error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
