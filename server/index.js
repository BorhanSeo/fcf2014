require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const paymentRoutes = require('./src/routes/payments');
const investmentRoutes = require('./src/routes/investments');
const expenseRoutes = require('./src/routes/expenses');
const assetRoutes = require('./src/routes/assets');
const reportRoutes = require('./src/routes/reports');
const incomeRoutes = require('./src/routes/incomes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/incomes', incomeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FCF 2014 সার্ভার চালু আছে', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'রাউট পাওয়া যায়নি' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'সার্ভার এরর', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

app.listen(PORT, () => {
  console.log(`\n🏦 FCF 2014 সার্ভার চালু হয়েছে — http://localhost:${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health\n`);
});
