const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

const prisma = new PrismaClient();

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'ইমেইল ও পাসওয়ার্ড প্রদান করুন' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'ভুল ইমেইল অথবা পাসওয়ার্ড' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'ভুল ইমেইল অথবা পাসওয়ার্ড' });
    }

    const token = generateToken({ id: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        joinDate: user.joinDate,
        monthlyAmount: user.monthlyAmount,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // JWT stateless, client side token delete করবে
  res.json({ message: 'সফলভাবে লগআউট হয়েছে' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { login, logout, getMe };
