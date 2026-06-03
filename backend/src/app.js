// GoTix Backend — OTP registration flow active
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const proRoutes = require('./routes/proRoutes');
const walletRoutes = require('./routes/walletRoutes');
const withdrawalRoutes = require('./routes/withdrawalRoutes');
const topUpRoutes = require('./routes/topUpRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const supportRoutes  = require('./routes/supportRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // Allow github.io and pages.dev (Cloudflare Pages)
    if (/^https:\/\/[a-z0-9-]+\.github\.io$/.test(origin)) return cb(null, true);
    if (/^https:\/\/[a-z0-9-]+\.pages\.dev$/.test(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pro', proRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/topups', topUpRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/support',  supportRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GoTix API is running' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
