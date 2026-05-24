const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');
const ProSubscription = require('../models/ProSubscription');
const Withdrawal = require('../models/Withdrawal');
const TopUp = require('../models/TopUp');
const { success, error } = require('../utils/apiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, totalTickets, totalTransactions,
      pendingTickets, pendingReports, completedTxs, pendingWithdrawals, pendingTopUps,
    ] = await Promise.all([
      User.countDocuments(),
      Ticket.countDocuments(),
      Transaction.countDocuments(),
      Ticket.countDocuments({ verifyStatus: 'pending' }),
      Report.countDocuments({ status: 'pending' }),
      Transaction.find({ transactionStatus: 'completed' }, 'totalPrice platformFee'),
      Withdrawal.countDocuments({ status: 'pending' }),
      TopUp.countDocuments({ status: 'pending' }),
    ]);

    const totalRevenue      = completedTxs.reduce((s, t) => s + t.totalPrice, 0);
    const totalPlatformFee  = completedTxs.reduce((s, t) => s + (t.platformFee || 0), 0);

    const pendingAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$pendingBalance' } } },
    ]);
    const totalPendingBalance = pendingAgg[0]?.total ?? 0;

    return res.json(
      success('Dashboard', {
        totalUsers, totalTickets, totalTransactions,
        pendingTickets, pendingReports,
        totalRevenue, totalPlatformFee, totalPendingBalance,
        completedTransactions: completedTxs.length,
        pendingWithdrawals, pendingTopUps,
      })
    );
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.json(success('Danh sách người dùng', {
      users,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }));
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json(error('Không tìm thấy người dùng'));
    return res.json(success('Cập nhật trạng thái tài khoản thành công', { user }));
  } catch (err) {
    next(err);
  }
};

const getPendingTickets = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      Ticket.find({ verifyStatus: 'pending' })
        .populate('ownerId', 'name email avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Ticket.countDocuments({ verifyStatus: 'pending' }),
    ]);
    return res.json(success('Vé chờ duyệt', {
      tickets,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

const adminVerifyTicket = async (req, res, next) => {
  try {
    const { verifyStatus } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { verifyStatus }, { new: true });
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));
    return res.json(success('Xác minh vé thành công', { ticket }));
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporterId', 'name email')
        .populate('ticketId', 'title category')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Report.countDocuments(filter),
    ]);
    return res.json(success('Danh sách báo cáo', {
      reports,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!report) return res.status(404).json(error('Không tìm thấy báo cáo'));
    return res.json(success('Xử lý báo cáo thành công', { report }));
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { transactionStatus, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (transactionStatus) filter.transactionStatus = transactionStatus;
    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .populate('ticketId', 'title category')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Transaction.countDocuments(filter),
    ]);
    return res.json(success('Danh sách giao dịch', {
      transactions,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

const getProSubscriptions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [subscriptions, total] = await Promise.all([
      ProSubscription.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ProSubscription.countDocuments(filter),
    ]);
    return res.json(success('Danh sách gói Pro', {
      subscriptions,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

// ── Withdrawals ──────────────────────────────────────────────────────────────

const getWithdrawals = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Withdrawal.countDocuments(filter),
    ]);
    return res.json(success('Danh sách yêu cầu rút tiền', {
      withdrawals,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

const approveWithdrawal = async (req, res, next) => {
  try {
    const wd = await Withdrawal.findById(req.params.id);
    if (!wd) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (wd.status !== 'pending') return res.status(400).json(error('Yêu cầu đã được xử lý rồi'));

    // Số dư đã bị trừ khi user tạo yêu cầu — chỉ cập nhật trạng thái
    wd.status      = 'approved';
    wd.processedAt = new Date();
    wd.processedBy = req.user.id;
    wd.adminNote   = req.body.adminNote || '';
    await wd.save();

    return res.json(success('Duyệt yêu cầu rút tiền thành công', { withdrawal: wd }));
  } catch (err) {
    next(err);
  }
};

const rejectWithdrawal = async (req, res, next) => {
  try {
    const wd = await Withdrawal.findById(req.params.id);
    if (!wd) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (wd.status !== 'pending') return res.status(400).json(error('Yêu cầu đã được xử lý rồi'));

    // Hoàn lại tiền vào ví user
    await User.findByIdAndUpdate(wd.userId, { $inc: { availableBalance: wd.amount } });

    wd.status      = 'rejected';
    wd.processedAt = new Date();
    wd.processedBy = req.user.id;
    wd.adminNote   = req.body.adminNote || '';
    await wd.save();

    return res.json(success('Từ chối yêu cầu rút tiền, số dư đã được hoàn lại', { withdrawal: wd }));
  } catch (err) {
    next(err);
  }
};

// ── TopUps ───────────────────────────────────────────────────────────────────

const getTopUps = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [topUps, total] = await Promise.all([
      TopUp.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      TopUp.countDocuments(filter),
    ]);
    return res.json(success('Danh sách lệnh nạp tiền', {
      topUps,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

const approveTopUp = async (req, res, next) => {
  try {
    const tu = await TopUp.findById(req.params.id);
    if (!tu) return res.status(404).json(error('Không tìm thấy lệnh nạp'));
    if (tu.status !== 'pending') return res.status(400).json(error('Lệnh nạp đã được xử lý rồi'));

    // Cộng tiền vào ví khả dụng
    await User.findByIdAndUpdate(tu.userId, {
      $inc: { availableBalance: tu.amount, totalRevenue: tu.amount },
    });

    tu.status      = 'approved';
    tu.processedAt = new Date();
    tu.processedBy = req.user.id;
    tu.adminNote   = req.body.adminNote || '';
    await tu.save();

    return res.json(success(`Đã duyệt và cộng ${tu.amount.toLocaleString('vi-VN')}đ vào ví người dùng`, { topUp: tu }));
  } catch (err) {
    next(err);
  }
};

const rejectTopUp = async (req, res, next) => {
  try {
    const tu = await TopUp.findById(req.params.id);
    if (!tu) return res.status(404).json(error('Không tìm thấy lệnh nạp'));
    if (tu.status !== 'pending') return res.status(400).json(error('Lệnh nạp đã được xử lý rồi'));

    tu.status      = 'rejected';
    tu.processedAt = new Date();
    tu.processedBy = req.user.id;
    tu.adminNote   = req.body.adminNote || '';
    await tu.save();

    return res.json(success('Đã từ chối lệnh nạp tiền', { topUp: tu }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard, getUsers, updateUserStatus,
  getPendingTickets, adminVerifyTicket,
  getReports, resolveReport, getTransactions,
  getProSubscriptions,
  getWithdrawals, approveWithdrawal, rejectWithdrawal,
  getTopUps, approveTopUp, rejectTopUp,
};
