const express = require('express');
const router = express.Router();
const {
  getDashboard, getUsers, updateUserStatus,
  getPendingTickets, adminVerifyTicket,
  getReports, resolveReport, getTransactions,
  getProSubscriptions,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  getTopUps, approveTopUp, rejectTopUp,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

// All admin routes require authentication + admin role
router.use(protect, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.get('/tickets/pending', getPendingTickets);
router.patch('/tickets/:id/verify', adminVerifyTicket);
router.get('/reports', getReports);
router.patch('/reports/:id/resolve', resolveReport);
router.get('/transactions', getTransactions);
router.get('/pro-subscriptions', getProSubscriptions);
router.get('/withdrawals', getWithdrawals);
router.patch('/withdrawals/:id/approve', approveWithdrawal);
router.patch('/withdrawals/:id/reject', rejectWithdrawal);
router.get('/topups', getTopUps);
router.patch('/topups/:id/approve', approveTopUp);
router.patch('/topups/:id/reject', rejectTopUp);

module.exports = router;
