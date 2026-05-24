const Report = require('../models/Report');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { success, error } = require('../utils/apiResponse');

const REASON_LABELS = {
  fake_ticket: 'Vé giả',
  invalid_qr: 'QR không hợp lệ',
  seller_unresponsive: 'Người bán không phản hồi',
  wrong_info: 'Sai thông tin vé',
  transaction_issue: 'Giao dịch có vấn đề',
  other: 'Khác',
};

const createReport = async (req, res, next) => {
  try {
    const { ticketId, transactionId, reason, description } = req.body;
    if (!REASON_LABELS[reason]) return res.status(400).json(error('Lý do không hợp lệ'));

    const report = await Report.create({
      reporterId: req.user.id, ticketId, transactionId, reason, description,
    });

    // Notify admin (find first admin user)
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      await notify({
        receiverId: admin._id,
        title: 'Báo cáo mới',
        message: `Có báo cáo mới: ${REASON_LABELS[reason]}`,
        type: 'report_submitted',
        relatedId: report._id.toString(),
      });
    }

    return res.status(201).json(success('Báo cáo thành công', { report }));
  } catch (err) {
    next(err);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reporterId: req.user.id })
      .populate('ticketId', 'title category location')
      .sort({ createdAt: -1 });
    return res.json(success('Báo cáo của tôi', { reports }));
  } catch (err) {
    next(err);
  }
};

// Admin: get single report detail
const getReportDetail = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporterId', 'name email avatar')
      .populate('ticketId')
      .populate('transactionId');
    if (!report) return res.status(404).json(error('Không tìm thấy báo cáo'));
    return res.json(success('Chi tiết báo cáo', { report }));
  } catch (err) {
    next(err);
  }
};

// Admin: resolve report (valid) — optionally refund buyer & lock ticket
const resolveReport = async (req, res, next) => {
  try {
    const { adminNote, refund = false, lockTicket = false, resolution } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json(error('Không tìm thấy báo cáo'));
    if (report.status === 'resolved' || report.status === 'rejected') {
      return res.status(400).json(error('Báo cáo đã được xử lý'));
    }

    // Lock ticket
    if (lockTicket && report.ticketId) {
      await Ticket.findByIdAndUpdate(report.ticketId, { status: 'hidden' });
    }

    // Refund buyer from transaction
    if (refund && report.transactionId) {
      const tx = await Transaction.findById(report.transactionId);
      if (tx && tx.transactionStatus !== 'refunded') {
        await User.findByIdAndUpdate(tx.buyerId, { $inc: { availableBalance: tx.totalPrice } });
        await Transaction.findByIdAndUpdate(report.transactionId, { transactionStatus: 'refunded' });
        report.refundIssued = true;

        await notify({
          receiverId: tx.buyerId,
          title: 'Báo cáo được chấp thuận — hoàn tiền',
          message: `Báo cáo của bạn đã được xử lý. ${tx.totalPrice?.toLocaleString('vi-VN')}đ đã hoàn vào ví.`,
          type: 'report_resolved',
          relatedId: tx._id.toString(),
        });
      }
    }

    // Increase violationCount on seller
    const ticket = await Ticket.findById(report.ticketId);
    if (ticket) {
      await User.findByIdAndUpdate(ticket.ownerId, { $inc: { violationCount: 1 } });
    }

    report.status = 'resolved';
    report.resolution = resolution || '';
    report.adminNote = adminNote || '';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    await report.save();

    return res.json(success('Đã xử lý báo cáo', { report }));
  } catch (err) {
    next(err);
  }
};

// Admin: reject report (invalid)
const rejectReport = async (req, res, next) => {
  try {
    const { adminNote } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json(error('Không tìm thấy báo cáo'));

    report.status = 'rejected';
    report.adminNote = adminNote || '';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user.id;
    await report.save();

    return res.json(success('Đã từ chối báo cáo', { report }));
  } catch (err) {
    next(err);
  }
};

// Admin: request more evidence
const requestEvidence = async (req, res, next) => {
  try {
    const { adminNote } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json(error('Không tìm thấy báo cáo'));

    report.status = 'requesting_evidence';
    report.adminNote = adminNote || '';
    await report.save();

    await notify({
      receiverId: report.reporterId,
      title: 'Yêu cầu bổ sung bằng chứng',
      message: `Admin yêu cầu bạn cung cấp thêm bằng chứng cho báo cáo.${adminNote ? ' ' + adminNote : ''}`,
      type: 'report_submitted',
      relatedId: report._id.toString(),
    });

    return res.json(success('Đã yêu cầu bằng chứng', { report }));
  } catch (err) {
    next(err);
  }
};

module.exports = { createReport, getMyReports, getReportDetail, resolveReport, rejectReport, requestEvidence };
