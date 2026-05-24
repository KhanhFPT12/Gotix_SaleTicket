const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const Report = require('../models/Report');
const ProSubscription = require('../models/ProSubscription');
const Withdrawal = require('../models/Withdrawal');
const TopUp = require('../models/TopUp');
const AuditLog = require('../models/AuditLog');
const { notify } = require('../services/notificationService');
const { log: auditLog } = require('../services/auditLogService');
const emailService = require('../services/emailService');
const { success, error } = require('../utils/apiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers, totalTickets, totalTransactions,
      pendingTickets, pendingReports, completedTxs,
      pendingWithdrawals, pendingTopUps, lockedUsers, expiredTickets,
    ] = await Promise.all([
      User.countDocuments(),
      Ticket.countDocuments(),
      Transaction.countDocuments(),
      Ticket.countDocuments({ verifyStatus: 'pending' }),
      Report.countDocuments({ status: 'pending' }),
      Transaction.find({ transactionStatus: 'completed' }, 'totalPrice platformFee'),
      Withdrawal.countDocuments({ status: 'pending' }),
      TopUp.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: false }),
      Ticket.countDocuments({ status: 'expired' }),
    ]);

    const totalRevenue     = completedTxs.reduce((s, t) => s + t.totalPrice, 0);
    const totalPlatformFee = completedTxs.reduce((s, t) => s + (t.platformFee || 0), 0);

    const pendingAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$pendingBalance' } } },
    ]);
    const totalPendingBalance = pendingAgg[0]?.total ?? 0;

    return res.json(success('Dashboard', {
      totalUsers, totalTickets, totalTransactions,
      pendingTickets, pendingReports,
      totalRevenue, totalPlatformFee, totalPendingBalance,
      completedTransactions: completedTxs.length,
      pendingWithdrawals, pendingTopUps,
      lockedUsers, expiredTickets,
    }));
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

    await auditLog({
      adminId: req.user.id,
      action: isActive ? 'unlock_user' : 'lock_user',
      targetType: 'User',
      targetId: user._id,
      description: `${isActive ? 'Mở khóa' : 'Khóa'} tài khoản ${user.email}`,
    });

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
    const { verifyStatus, adminNote } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { verifyStatus }, { new: true })
      .populate('ownerId', 'name email');
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));

    const owner = ticket.ownerId;
    if (verifyStatus === 'verified') {
      await notify({
        receiverId: owner._id,
        title: 'Vé đã được duyệt',
        message: `Vé "${ticket.title}" của bạn đã được admin duyệt và hiển thị trên marketplace.`,
        type: 'ticket_approved',
        relatedId: ticket._id.toString(),
      });
      await emailService.ticketApproved(owner, ticket);
    } else if (verifyStatus === 'rejected') {
      await notify({
        receiverId: owner._id,
        title: 'Vé bị từ chối',
        message: `Vé "${ticket.title}" đã bị từ chối.${adminNote ? ' Lý do: ' + adminNote : ''}`,
        type: 'ticket_rejected',
        relatedId: ticket._id.toString(),
      });
      await emailService.ticketRejected(owner, ticket, adminNote);
    }

    await auditLog({
      adminId: req.user.id,
      action: verifyStatus === 'verified' ? 'approve_ticket' : 'reject_ticket',
      targetType: 'Ticket',
      targetId: ticket._id,
      description: `${verifyStatus === 'verified' ? 'Duyệt' : 'Từ chối'} vé "${ticket.title}"`,
    });

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

    await auditLog({
      adminId: req.user.id,
      action: 'resolve_report',
      targetType: 'Report',
      targetId: report._id,
      description: `Xử lý báo cáo → ${status}`,
    });

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
    const wd = await Withdrawal.findById(req.params.id).populate('userId', 'name email');
    if (!wd) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (wd.status !== 'pending') return res.status(400).json(error('Yêu cầu đã được xử lý rồi'));

    wd.status      = 'approved';
    wd.processedAt = new Date();
    wd.processedBy = req.user.id;
    wd.adminNote   = req.body.adminNote || '';
    await wd.save();

    const user = wd.userId;
    await notify({
      receiverId: user._id,
      title: 'Yêu cầu rút tiền được duyệt',
      message: `Yêu cầu rút ${wd.amount?.toLocaleString('vi-VN')}đ đã được duyệt.`,
      type: 'withdrawal_approved',
      relatedId: wd._id.toString(),
    });
    await emailService.withdrawalApproved(user, wd.amount);

    await auditLog({
      adminId: req.user.id,
      action: 'approve_withdrawal',
      targetType: 'Withdrawal',
      targetId: wd._id,
      description: `Duyệt rút tiền ${wd.amount?.toLocaleString('vi-VN')}đ cho ${user.email}`,
    });

    return res.json(success('Duyệt yêu cầu rút tiền thành công', { withdrawal: wd }));
  } catch (err) {
    next(err);
  }
};

const rejectWithdrawal = async (req, res, next) => {
  try {
    const wd = await Withdrawal.findById(req.params.id).populate('userId', 'name email');
    if (!wd) return res.status(404).json(error('Không tìm thấy yêu cầu'));
    if (wd.status !== 'pending') return res.status(400).json(error('Yêu cầu đã được xử lý rồi'));

    await User.findByIdAndUpdate(wd.userId._id, { $inc: { availableBalance: wd.amount } });

    wd.status      = 'rejected';
    wd.processedAt = new Date();
    wd.processedBy = req.user.id;
    wd.adminNote   = req.body.adminNote || '';
    await wd.save();

    const user = wd.userId;
    await notify({
      receiverId: user._id,
      title: 'Yêu cầu rút tiền bị từ chối',
      message: `Yêu cầu rút ${wd.amount?.toLocaleString('vi-VN')}đ bị từ chối. Số tiền đã hoàn về ví.`,
      type: 'withdrawal_rejected',
      relatedId: wd._id.toString(),
    });
    await emailService.withdrawalRejected(user, wd.amount, wd.adminNote);

    await auditLog({
      adminId: req.user.id,
      action: 'reject_withdrawal',
      targetType: 'Withdrawal',
      targetId: wd._id,
      description: `Từ chối rút tiền ${wd.amount?.toLocaleString('vi-VN')}đ của ${user.email}`,
    });

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
    const tu = await TopUp.findById(req.params.id).populate('userId', 'name email');
    if (!tu) return res.status(404).json(error('Không tìm thấy lệnh nạp'));
    if (tu.status !== 'pending') return res.status(400).json(error('Lệnh nạp đã được xử lý rồi'));

    await User.findByIdAndUpdate(tu.userId._id, {
      $inc: { availableBalance: tu.amount, totalRevenue: tu.amount },
    });

    tu.status      = 'approved';
    tu.processedAt = new Date();
    tu.processedBy = req.user.id;
    tu.adminNote   = req.body.adminNote || '';
    await tu.save();

    await notify({
      receiverId: tu.userId._id,
      title: 'Nạp tiền thành công',
      message: `${tu.amount?.toLocaleString('vi-VN')}đ đã được cộng vào ví của bạn.`,
      type: 'wallet_credited',
      relatedId: tu._id.toString(),
    });

    await auditLog({
      adminId: req.user.id,
      action: 'approve_topup',
      targetType: 'TopUp',
      targetId: tu._id,
      description: `Duyệt nạp ${tu.amount?.toLocaleString('vi-VN')}đ cho ${tu.userId.email}`,
    });

    return res.json(success(`Đã duyệt và cộng ${tu.amount?.toLocaleString('vi-VN')}đ vào ví người dùng`, { topUp: tu }));
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

    await auditLog({
      adminId: req.user.id,
      action: 'reject_topup',
      targetType: 'TopUp',
      targetId: tu._id,
      description: `Từ chối nạp ${tu.amount?.toLocaleString('vi-VN')}đ`,
    });

    return res.json(success('Đã từ chối lệnh nạp tiền', { topUp: tu }));
  } catch (err) {
    next(err);
  }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, targetType } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('adminId', 'name email')
        .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);
    return res.json(success('Audit logs', {
      logs,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
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
  getAuditLogs,
};
