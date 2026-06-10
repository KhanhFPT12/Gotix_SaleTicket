const Transaction = require('../models/Transaction');
const Ticket      = require('../models/Ticket');
const User        = require('../models/User');
const { computeFees, addPendingBalance, releasePendingToAvailable, reversePendingBalance, deductAvailableBalance } = require('../services/walletService');
const { notify }       = require('../services/notificationService');
const emailService     = require('../services/emailService');
const { success, error } = require('../utils/apiResponse');
const { formatTicketResponse } = require('./ticketController');

const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// ── Create transaction ────────────────────────────────────────────────────────
const createTransaction = async (req, res, next) => {
  try {
    const { ticketId, quantity, paymentMethod } = req.body;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json(error('Không tìm thấy vé'));

    if (ticket.verifyStatus !== 'verified' || ticket.status !== 'available') {
      return res.status(400).json(error('Vé không khả dụng để mua'));
    }
    if (ticket.ownerId.toString() === req.user.id) {
      return res.status(400).json(error('Không thể mua vé của chính mình'));
    }
    if (ticket.quantity < Number(quantity)) {
      return res.status(400).json(error(`Chỉ còn ${ticket.quantity} vé`));
    }

    const totalPrice = ticket.resalePrice * Number(quantity);
    const { platformFee, sellerAmount } = computeFees(totalPrice);
    // Buyer pays: totalPrice + platformFee (buyer's fee = 2% of frontend display)
    const buyerAmount = totalPrice + platformFee;

    // ── Wallet payment: deduct immediately, skip QR + admin confirm ─────────
    if (paymentMethod === 'wallet') {
      const buyer = await User.findById(req.user.id);
      if (!buyer || buyer.availableBalance < buyerAmount) {
        return res.status(400).json(error(
          `Số dư ví không đủ. Cần ${buyerAmount.toLocaleString('vi-VN')}đ, hiện có ${(buyer?.availableBalance || 0).toLocaleString('vi-VN')}đ`
        ));
      }

      // Deduct from buyer
      await deductAvailableBalance(req.user.id, buyerAmount);

      // Reduce ticket quantity
      ticket.quantity = Math.max(0, ticket.quantity - Number(quantity));
      if (ticket.quantity === 0) ticket.status = 'sold';
      await ticket.save();

      // Credit seller immediately
      await addPendingBalance(ticket.ownerId, sellerAmount);
      await releasePendingToAvailable(ticket.ownerId, sellerAmount);

      const transaction = await Transaction.create({
        buyerId:        req.user.id,
        sellerId:       ticket.ownerId,
        ticketId,
        quantity:       Number(quantity),
        totalPrice,
        platformFee,
        sellerAmount,
        paymentMethod:  'wallet',
        paymentNote:    req.user.name || '',
        status:         'completed',
        sellerCredited: true,
      });

      // Notify both parties
      await notify({
        receiverId: req.user.id,
        title: 'Thanh toán ví thành công',
        message: `Đã trừ ${buyerAmount.toLocaleString('vi-VN')}đ từ ví. Giao dịch hoàn tất!`,
        type: 'transaction_completed',
        relatedId: transaction._id.toString(),
      });
      await notify({
        receiverId: ticket.ownerId,
        title: 'Vé đã được bán',
        message: `${sellerAmount.toLocaleString('vi-VN')}đ đã vào ví khả dụng của bạn.`,
        type: 'transaction_completed',
        relatedId: transaction._id.toString(),
      });

      return res.status(201).json(success('Thanh toán bằng ví thành công', { transaction }));
    }

    // ── QR transfer: standard flow ─────────────────────────────────────────
    const transaction = await Transaction.create({
      buyerId:          req.user.id,
      sellerId:         ticket.ownerId,
      ticketId,
      quantity:         Number(quantity),
      totalPrice,
      platformFee,
      sellerAmount,
      paymentMethod:    'qr_transfer',
      paymentNote:      req.user.name || '',
      paymentExpiredAt: new Date(Date.now() + PAYMENT_EXPIRY_MS),
      status:           'pending_payment',
    });

    return res.status(201).json(success('Tạo giao dịch thành công', { transaction }));
  } catch (err) {
    next(err);
  }
};

// ── User confirms they transferred money ──────────────────────────────────────
const confirmUserPaid = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));
    if (tx.buyerId.toString() !== req.user.id) return res.status(403).json(error('Không có quyền'));
    if (tx.status !== 'pending_payment') {
      return res.status(400).json(error('Giao dịch không ở trạng thái chờ thanh toán'));
    }

    // Check expiry
    if (tx.paymentExpiredAt && new Date() > tx.paymentExpiredAt) {
      tx.status = 'expired';
      await tx.save();
      return res.status(400).json(error('Giao dịch đã hết thời gian thanh toán'));
    }

    tx.status = 'waiting_admin_confirm';
    await tx.save();

    await notify({
      receiverId: tx.sellerId,
      title: 'Người mua đã chuyển khoản',
      message: `${req.user.name} đã xác nhận chuyển khoản. Chờ GoTix xác minh.`,
      type: 'ticket_sold',
      relatedId: tx._id.toString(),
    });

    return res.json(success('Đã ghi nhận xác nhận chuyển khoản — chờ GoTix xác minh', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

// ── Admin confirms money received ─────────────────────────────────────────────
const adminConfirmTransaction = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(error('Không có quyền'));

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));
    if (tx.status !== 'waiting_admin_confirm') {
      return res.status(400).json(error('Giao dịch không ở trạng thái chờ xác nhận'));
    }

    // Reduce ticket quantity
    const ticket = await Ticket.findById(tx.ticketId);
    if (ticket) {
      ticket.quantity = Math.max(0, ticket.quantity - tx.quantity);
      if (ticket.quantity === 0) ticket.status = 'sold';
      await ticket.save();
    }

    // Credit seller
    if (!tx.sellerCredited) {
      await addPendingBalance(tx.sellerId, tx.sellerAmount);
      await releasePendingToAvailable(tx.sellerId, tx.sellerAmount);
      tx.sellerCredited = true;
    }

    tx.status = 'completed';
    await tx.save();

    const [buyer, seller] = await Promise.all([
      User.findById(tx.buyerId),
      User.findById(tx.sellerId),
    ]);

    await notify({
      receiverId: tx.buyerId,
      title: 'Thanh toán được xác nhận',
      message: 'GoTix đã xác nhận thanh toán của bạn. Giao dịch hoàn tất!',
      type: 'transaction_completed',
      relatedId: tx._id.toString(),
    });
    await notify({
      receiverId: tx.sellerId,
      title: 'Giao dịch hoàn tất',
      message: `${tx.sellerAmount?.toLocaleString('vi-VN')}đ đã vào ví khả dụng của bạn.`,
      type: 'transaction_completed',
      relatedId: tx._id.toString(),
    });

    if (buyer) await emailService.transactionCompleted(buyer, ticket, tx.totalPrice).catch(() => {});

    return res.json(success('Xác nhận thanh toán thành công — giao dịch hoàn tất', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

// ── Admin rejects transaction ─────────────────────────────────────────────────
const adminRejectTransaction = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(error('Không có quyền'));

    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));
    if (!['waiting_admin_confirm', 'pending_payment'].includes(tx.status)) {
      return res.status(400).json(error('Không thể từ chối giao dịch ở trạng thái này'));
    }

    tx.status = 'failed';
    await tx.save();

    await notify({
      receiverId: tx.buyerId,
      title: 'Thanh toán bị từ chối',
      message: 'GoTix không xác nhận được giao dịch của bạn. Vui lòng liên hệ hỗ trợ.',
      type: 'transaction_cancelled',
      relatedId: tx._id.toString(),
    });

    return res.json(success('Đã từ chối giao dịch', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

// ── Cancel transaction (buyer) ────────────────────────────────────────────────
const cancelTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));

    const isBuyer = tx.buyerId.toString() === req.user.id;
    if (!isBuyer && req.user.role !== 'admin') return res.status(403).json(error('Không có quyền hủy giao dịch này'));
    if (['completed', 'failed', 'expired'].includes(tx.status)) {
      return res.status(400).json(error('Không thể hủy giao dịch đã kết thúc'));
    }
    if (tx.status === 'waiting_admin_confirm') {
      return res.status(400).json(error('Giao dịch đang chờ xác nhận, không thể tự hủy'));
    }

    tx.status = 'failed';
    await tx.save();

    await notify({
      receiverId: tx.buyerId,
      title: 'Giao dịch đã bị hủy',
      message: 'Giao dịch của bạn đã được hủy.',
      type: 'transaction_cancelled',
      relatedId: tx._id.toString(),
    });

    return res.json(success('Hủy giao dịch thành công', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

// ── Read ──────────────────────────────────────────────────────────────────────
const getMyPurchases = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ buyerId: req.user.id })
      .populate('ticketId')
      .populate('sellerId', 'name avatar rating')
      .sort({ createdAt: -1 });

    const formattedTxs = await Promise.all(transactions.map(async (tx) => {
      const txObj = tx.toObject();
      if (txObj.ticketId) {
        txObj.ticketId = await formatTicketResponse(txObj.ticketId, req.user, false);
      }
      return txObj;
    }));

    return res.json(success('Lịch sử mua vé', { transactions: formattedTxs }));
  } catch (err) {
    next(err);
  }
};

const getMySales = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ sellerId: req.user.id })
      .populate('ticketId')
      .populate('buyerId', 'name avatar')
      .sort({ createdAt: -1 });

    const formattedTxs = await Promise.all(transactions.map(async (tx) => {
      const txObj = tx.toObject();
      if (txObj.ticketId) {
        txObj.ticketId = await formatTicketResponse(txObj.ticketId, req.user, false);
      }
      return txObj;
    }));

    return res.json(success('Lịch sử bán vé', { transactions: formattedTxs }));
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('ticketId')
      .populate('buyerId',  'name email avatar phone')
      .populate('sellerId', 'name email avatar phone');
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));

    const isBuyer  = tx.buyerId._id.toString() === req.user.id;
    const isSeller = tx.sellerId._id.toString() === req.user.id;
    if (!isBuyer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json(error('Không có quyền xem giao dịch này'));
    }

    const txObj = tx.toObject();
    if (txObj.ticketId) {
      txObj.ticketId = await formatTicketResponse(txObj.ticketId, req.user, false);
    }

    return res.json(success('Chi tiết giao dịch', { transaction: txObj }));
  } catch (err) {
    next(err);
  }
};

// ── Public: recent completed transactions (social proof ticker) ───────────────
// No auth required — anonymized data only
const getRecentPublic = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 15, 30);
    const txs = await Transaction.find({ status: { $in: ['completed', 'paid'] } })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('buyerId',  'name')
      .populate('ticketId', 'title location city details');

    const items = txs.map(tx => {
      // Anonymize buyer: "Nguyễn Văn An" → "Nguyễn V. A."
      const fullName = tx.buyerId?.name || 'Khách';
      const parts = fullName.trim().split(' ');
      let anonName = parts[0];
      if (parts.length > 1) {
        // Add initials for middle + last parts
        anonName += ' ' + parts.slice(1).map(p => p.charAt(0) + '.').join(' ');
      }

      const ticket = tx.ticketId;
      const details = ticket?.details || {};

      return {
        buyerName:  anonName,
        movieTitle: details.movieTitle || ticket?.title || 'Vé phim',
        cinema:     details.cinemaName || ticket?.location || '',
        city:       ticket?.city || 'Đà Nẵng',
        quantity:   tx.quantity,
        completedAt: tx.updatedAt,
      };
    });

    return res.json({ success: true, data: { transactions: items } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction,
  confirmUserPaid,
  adminConfirmTransaction,
  adminRejectTransaction,
  cancelTransaction,
  getMyPurchases,
  getMySales,
  getTransactionById,
  getRecentPublic,
};
