const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { calculateUserPnL } = require('../utils/reportCalculators');

const prisma = new PrismaClient();

// GET /api/users — All users list (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
        createdAt: true,
        payments: {
          where: { status: 'PAID' },
          select: { amount: true, year: true, month: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    const year = new Date().getFullYear();
    const usersWithData = await Promise.all(
      users.map(async (u) => {
        const pnl = await calculateUserPnL(u.id, 'all-time');
        const totalPaid = u.payments.reduce((s, p) => s + p.amount, 0);
        const totalReceivable = Math.max(0, totalPaid + pnl.userProfitLoss - (pnl.userExpenseShare || 0));
        
        // Calculate Due
        const joinDate = new Date(u.joinDate);
        const now = new Date();
        const paidMap = new Map();
        u.payments.forEach(p => {
          const key = `${p.year}-${p.month}`;
          paidMap.set(key, (paidMap.get(key) || 0) + p.amount);
        });

        let totalDue = 0;
        let startMonth = joinDate.getMonth();
        let startYear = joinDate.getFullYear();
        
        // Start from September 2025 or later
        if (startYear < 2025 || (startYear === 2025 && startMonth < 8)) {
          startYear = 2025;
          startMonth = 8; // September (0-indexed)
        }

        let current = new Date(startYear, startMonth, 1);
        while (current <= now) {
          const y = current.getFullYear();
          const m = current.getMonth() + 1;
          
          let expected = u.monthlyAmount;
          const paid = paidMap.get(`${y}-${m}`) || 0;
          
          let dueAmount = expected - paid;
          if (dueAmount < 0) dueAmount = 0;

          if (dueAmount > 0) {
            totalDue += dueAmount;
          }
          current.setMonth(current.getMonth() + 1);
        }
        
        const { payments, ...userWithoutPayments } = u;
        return {
          ...userWithoutPayments,
          totalReceivable,
          totalDue
        };
      })
    );

    res.json({ users: usersWithData });
  } catch (error) {
    console.error('GetAllUsers error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/users — Create new user (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, monthlyAmount, joinDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        monthlyAmount: monthlyAmount || 0,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        joinDate: true,
        monthlyAmount: true,
        isActive: true,
      },
    });

    res.status(201).json({ message: 'ব্যবহারকারী সফলভাবে তৈরি হয়েছে', user });
  } catch (error) {
    console.error('CreateUser error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/users/:id — Single user detail (Admin)
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
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
        createdAt: true,
        payments: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
        profits: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    res.json({ user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/users/:id — Update user (Admin)
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, monthlyAmount, joinDate, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (monthlyAmount !== undefined) updateData.monthlyAmount = monthlyAmount;
    if (joinDate) updateData.joinDate = new Date(joinDate);
    if (password) updateData.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        joinDate: true,
        monthlyAmount: true,
        isActive: true,
      },
    });

    res.json({ message: 'ব্যবহারকারী আপডেট হয়েছে', user });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PATCH /api/users/:id/toggle — Activate/Deactivate (Admin)
const toggleUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    res.json({
      message: updatedUser.isActive ? 'অ্যাকাউন্ট সক্রিয় করা হয়েছে' : 'অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে',
      user: updatedUser,
    });
  } catch (error) {
    console.error('ToggleUser error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/users/my-summary — User dashboard summary
const getMySummary = async (req, res) => {
  try {
    const pnl = await calculateUserPnL(req.user.id, 'all-time');
    
    res.json({ pnl });
  } catch (error) {
    console.error('GetMySummary error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/users/:id/summary — User dashboard summary (Admin)
const getUserSummary = async (req, res) => {
  try {
    const pnl = await calculateUserPnL(req.params.id, 'all-time');
    
    res.json({ pnl });
  } catch (error) {
    console.error('GetUserSummary error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/users/:id/profit — Add manual profit (Admin)
const addUserProfit = async (req, res) => {
  try {
    const { amount, date, note } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ message: 'টাকার পরিমাণ এবং তারিখ আবশ্যক' });
    }

    const profit = await prisma.userProfit.create({
      data: {
        userId: req.params.id,
        amount: Number(amount),
        date: new Date(date),
        note,
      },
    });

    res.status(201).json({ message: 'লাভ/বোনাস এন্ট্রি সফল হয়েছে', profit });
  } catch (error) {
    console.error('AddUserProfit error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// DELETE /api/users/profit/:profitId — Delete manual profit (Admin)
const deleteUserProfit = async (req, res) => {
  try {
    await prisma.userProfit.delete({
      where: { id: req.params.profitId },
    });

    res.json({ message: 'লাভ/বোনাস এন্ট্রি ডিলিট হয়েছে' });
  } catch (error) {
    console.error('DeleteUserProfit error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// DELETE /api/users/:id — Delete user (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    await prisma.user.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'ব্যবহারকারীকে সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = { getAllUsers, createUser, getUserById, updateUser, toggleUser, getMySummary, getUserSummary, addUserProfit, deleteUserProfit, deleteUser };
