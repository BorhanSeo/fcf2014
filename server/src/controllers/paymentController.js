const prisma = require('../utils/prisma');
const cache = require('../utils/cache');

// GET /api/payments/my — My payment history (User)
const getMyPayments = async (req, res) => {
  try {
    const { year } = req.query;

    const where = { userId: req.user.id };
    if (year) where.year = parseInt(year);

    const payments = await prisma.payment.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    // Summary
    const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
    const totalDue = payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.amount, 0);

    res.json({ payments, summary: { totalPaid, totalDue, count: payments.length } });
  } catch (error) {
    console.error('GetMyPayments error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/payments/user/:id — User's payments (Admin)
const getUserPayments = async (req, res) => {
  try {
    const { year } = req.query;

    const where = { userId: req.params.id };
    if (year) where.year = parseInt(year);

    const payments = await prisma.payment.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { user: { select: { name: true, email: true } } },
    });

    res.json({ payments });
  } catch (error) {
    console.error('GetUserPayments error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/payments — Enter payment (Admin)
const createPayment = async (req, res) => {
  try {
    const { userId, year, month, amount, paidDate, note, method } = req.body;

    if (!userId || !year || !month || !amount) {
      return res.status(400).json({ message: 'সদস্য, বছর, মাস ও পরিমাণ আবশ্যক' });
    }

    // Duplicate check
    const existing = await prisma.payment.findUnique({
      where: { userId_year_month: { userId, year: parseInt(year), month: parseInt(month) } },
    });

    if (existing) {
      return res.status(400).json({
        message: `এই সদস্যের ${year} সালের ${month} মাসের পেমেন্ট ইতিমধ্যে আছে`,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        year: parseInt(year),
        month: parseInt(month),
        amount: parseFloat(amount),
        paidDate: paidDate ? new Date(paidDate) : new Date(),
        method: method || 'CASH',
        note: note || null,
        status: 'PAID',
      },
      include: { user: { select: { name: true } } },
    });

    cache.invalidateAll();
    res.status(201).json({ message: 'পেমেন্ট সফলভাবে জমা হয়েছে', payment });
  } catch (error) {
    console.error('CreatePayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/payments/bulk — Bulk payment entry (Admin) — OPTIMIZED with transaction
const createBulkPayments = async (req, res) => {
  try {
    const { payments } = req.body; // Array of { userId, year, month, amount, paidDate, note }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return res.status(400).json({ message: 'পেমেন্ট তালিকা প্রদান করুন' });
    }

    // Pre-fetch all existing payments in one query (instead of N queries)
    const existingKeys = payments.map(p => ({
      userId: p.userId, year: parseInt(p.year), month: parseInt(p.month)
    }));
    
    const existing = await prisma.payment.findMany({
      where: {
        OR: existingKeys.map(k => ({
          userId: k.userId, year: k.year, month: k.month
        }))
      },
      select: { userId: true, year: true, month: true }
    });

    const existingSet = new Set(
      existing.map(e => `${e.userId}-${e.year}-${e.month}`)
    );

    const results = { success: [], failed: [] };
    const toCreate = [];

    for (const p of payments) {
      const key = `${p.userId}-${parseInt(p.year)}-${parseInt(p.month)}`;
      if (existingSet.has(key)) {
        results.failed.push({ userId: p.userId, reason: 'ডুপ্লিকেট এন্ট্রি' });
      } else {
        toCreate.push({
          userId: p.userId,
          year: parseInt(p.year),
          month: parseInt(p.month),
          amount: parseFloat(p.amount),
          paidDate: p.paidDate ? new Date(p.paidDate) : new Date(),
          note: p.note || null,
          status: 'PAID',
        });
      }
    }

    // Batch create in a single transaction
    if (toCreate.length > 0) {
      const created = await prisma.$transaction(
        toCreate.map(data => prisma.payment.create({ data }))
      );
      results.success = created;
    }

    cache.invalidateAll();
    res.status(201).json({
      message: `${results.success.length} টি সফল, ${results.failed.length} টি ব্যর্থ`,
      results,
    });
  } catch (error) {
    console.error('BulkPayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// PUT /api/payments/:id — Edit payment (Admin)
const updatePayment = async (req, res) => {
  try {
    const { amount, paidDate, note, status, method } = req.body;

    const updateData = {};
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (paidDate) updateData.paidDate = new Date(paidDate);
    if (note !== undefined) updateData.note = note;
    if (status) updateData.status = status;
    if (method) updateData.method = method;

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: updateData,
    });

    cache.invalidateAll();
    res.json({ message: 'পেমেন্ট আপডেট হয়েছে', payment });
  } catch (error) {
    console.error('UpdatePayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// DELETE /api/payments/:id — Delete payment (Admin)
const deletePayment = async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: req.params.id } });
    cache.invalidateAll();
    res.json({ message: 'পেমেন্ট মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('DeletePayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/payments/summary — All users payment summary (Admin)
const getPaymentSummary = async (req, res) => {
  try {
    const { year, month } = req.query;

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        monthlyAmount: true,
        joinDate: true,
        payments: {
          where: year ? { year: parseInt(year) } : undefined,
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    const summary = users.map((user) => {
      const totalPaid = user.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0);
      const paidMonths = user.payments.filter(p => p.status === 'PAID').length;

      return {
        id: user.id,
        name: user.name,
        monthlyAmount: user.monthlyAmount,
        joinDate: user.joinDate,
        totalPaid,
        paidMonths,
        payments: user.payments,
      };
    });

    res.json({ summary });
  } catch (error) {
    console.error('PaymentSummary error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/payments/my/dues — My due payments (User)
const getMyDues = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { joinDate: true, monthlyAmount: true },
    });

    const now = new Date();
    const joinDate = new Date(user.joinDate);
    const existingPayments = await prisma.payment.findMany({
      where: { userId: req.user.id, status: 'PAID' },
      select: { year: true, month: true, amount: true },
    });

    const paidMap = new Map();
    existingPayments.forEach(p => {
      const key = `${p.year}-${p.month}`;
      paidMap.set(key, (paidMap.get(key) || 0) + p.amount);
    });

    const dues = [];
    let startMonth = joinDate.getMonth();
    let startYear = joinDate.getFullYear();
    
    if (startYear < 2025 || (startYear === 2025 && startMonth < 8)) {
      startYear = 2025;
      startMonth = 8;
    }

    let current = new Date(startYear, startMonth, 1);
    while (current <= now) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      
      let expected = user.monthlyAmount;
      const paid = paidMap.get(`${y}-${m}`) || 0;
      
      let dueAmount = expected - paid;
      if (dueAmount < 0) dueAmount = 0;

      if (dueAmount > 0) {
        dues.push({
          year: y,
          month: m,
          expected,
          paid,
          amount: dueAmount,
          dueDate: new Date(y, m - 1, 1),
        });
      }
      current.setMonth(current.getMonth() + 1);
    }

    const totalDue = dues.reduce((s, d) => s + d.amount, 0);

    res.json({ dues, totalDue, dueCount: dues.length });
  } catch (error) {
    console.error('GetMyDues error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/payments/submit — User submits a payment
const submitPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month, amount, method, note } = req.body;

    if (!year || !month || !amount) {
      return res.status(400).json({ message: 'বছর, মাস ও পরিমাণ আবশ্যক' });
    }

    const existing = await prisma.payment.findUnique({
      where: { userId_year_month: { userId, year: parseInt(year), month: parseInt(month) } },
    });

    if (existing) {
      return res.status(400).json({ message: `আপনার ${year} সালের ${month} মাসের পেমেন্ট ইতিমধ্যে জমা বা অপেক্ষমান আছে` });
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        year: parseInt(year),
        month: parseInt(month),
        amount: parseFloat(amount),
        paidDate: new Date(),
        method: method || 'CASH',
        note: note || null,
        status: 'PENDING',
      },
      include: { user: { select: { name: true } } },
    });

    // Notify Admins
    await prisma.notification.create({
      data: {
        userId: null, // To all admins
        title: 'নতুন পেমেন্ট রিকোয়েস্ট',
        message: `${payment.user.name} ${year} সালের ${month} মাসের জন্য ৳${amount} পেমেন্ট সাবমিট করেছেন।`,
        type: 'PAYMENT_PENDING',
      }
    });

    cache.invalidateAll();
    res.status(201).json({ message: 'পেমেন্ট অনুমোদনের জন্য পাঠানো হয়েছে', payment });
  } catch (error) {
    console.error('SubmitPayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/payments/:id/approve — Admin approves payment
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.payment.findUnique({ where: { id }, include: { user: true } });
    if (!payment) return res.status(404).json({ message: 'পেমেন্ট পাওয়া যায়নি' });

    if (payment.status === 'PAID') {
      return res.status(400).json({ message: 'পেমেন্ট ইতিমধ্যে অনুমোদিত' });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status: 'PAID' },
    });

    // Notify User
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: 'পেমেন্ট অনুমোদিত',
        message: `আপনার ${payment.year} সালের ${payment.month} মাসের ৳${payment.amount} পেমেন্টটি অনুমোদিত হয়েছে।`,
        type: 'PAYMENT_APPROVED',
      }
    });

    cache.invalidateAll();
    res.json({ message: 'পেমেন্ট অনুমোদিত হয়েছে', payment: updatedPayment });
  } catch (error) {
    console.error('ApprovePayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// POST /api/payments/:id/reject — Admin rejects payment
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return res.status(404).json({ message: 'পেমেন্ট পাওয়া যায়নি' });

    await prisma.payment.delete({ where: { id } });

    // Notify User
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        title: 'পেমেন্ট বাতিল',
        message: `আপনার ${payment.year} সালের ${payment.month} মাসের ৳${payment.amount} পেমেন্টটি বাতিল করা হয়েছে। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।`,
        type: 'PAYMENT_REJECTED',
      }
    });

    cache.invalidateAll();
    res.json({ message: 'পেমেন্ট বাতিল করা হয়েছে' });
  } catch (error) {
    console.error('RejectPayment error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

// GET /api/payments/pending — Get all pending payments (Admin)
const getPendingPayments = async (req, res) => {
  try {
    const pendingPayments = await prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ pendingPayments });
  } catch (error) {
    console.error('GetPendingPayments error:', error);
    res.status(500).json({ message: 'সার্ভার এরর' });
  }
};

module.exports = {
  getMyPayments,
  getUserPayments,
  createPayment,
  createBulkPayments,
  updatePayment,
  deletePayment,
  getPaymentSummary,
  getMyDues,
  submitPayment,
  approvePayment,
  rejectPayment,
  getPendingPayments,
};
