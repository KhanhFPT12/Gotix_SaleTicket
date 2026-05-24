const Transaction = require('../models/Transaction');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { computeFees, addPendingBalance, releasePendingToAvailable, reversePendingBalance } = require('../services/walletService');
const { notify } = require('../services/notificationService');
const emailService = require('../services/emailService');
const { success, error } = require('../utils/apiResponse');

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

    const transaction = await Transaction.create({
      buyerId:   req.user.id,
      sellerId:  ticket.ownerId,
      ticketId,
      quantity:  Number(quantity),
      totalPrice,
      platformFee,
      sellerAmount,
      paymentMethod,
    });

    return res.status(201).json(success('Tạo giao dịch thành công', { transaction }));
  } catch (err) {
    next(err);
  }
};

// Buyer xác nhận đã thanh toán → tiền pending cho seller
const payTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));
    if (tx.buyerId.toString() !== req.user.id) return res.status(403).json(error('Không có quyền'));
    if (tx.paymentStatus === 'paid') return res.status(400).json(error('Giao dịch đã thanh toán rồi'));
    if (tx.transactionStatus !== 'pending') return res.status(400).json(error('Giao dịch không ở trạng thái có thể thanh toán'));

    const ticket = await Ticket.findById(tx.ticketId);
    if (ticket) {
      ticket.quantity = Math.max(0, ticket.quantity - tx.quantity);
      if (ticket.quantity === 0) ticket.status = 'sold';
      await ticket.save();
    }

    await addPendingBalance(tx.sellerId, tx.sellerAmount);

    tx.paymentStatus = 'paid';
    await tx.save();

    // Notify seller
    await notify({
      receiverId: tx.sellerId,
      title: 'Vé của bạn được mua',
      message: `Có người vừa thanh toán mua vé. ${tx.sellerAmount?.toLocaleString('vi-VN')}đ đang chờ xác nhận.`,
      type: 'ticket_sold',
      relatedId: tx._id.toString(),
    });

    return res.json(success('Xác nhận thanh toán thành công — tiền đang chờ xử lý', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

// Buyer xác nhận đã nhận vé → giao dịch hoàn tất, tiền pending → available
const completeTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));

    const isBuyer = tx.buyerId.toString() === req.user.id;
    if (!isBuyer && req.user.role !== 'admin') return res.status(403).json(error('Không có quyền'));
    if (tx.paymentStatus !== 'paid') return res.status(400).json(error('Cần thanh toán trước khi hoàn tất'));
    if (tx.transactionStatus === 'completed') return res.status(400).json(error('Giao dịch đã hoàn tất rồi'));
    if (tx.transactionStatus === 'cancelled') return res.status(400).json(error('Giao dịch đã bị hủy'));

    if (!tx.sellerCredited) {
      await releasePendingToAvailable(tx.sellerId, tx.sellerAmount);
      tx.sellerCredited = true;
    }

    tx.transactionStatus = 'completed';
    await tx.save();

    // Notify seller + send email to buyer
    await notify({
      receiverId: tx.sellerId,
      title: 'Giao dịch hoàn tất',
      message: `Giao dịch hoàn tất. ${tx.sellerAmount?.toLocaleString('vi-VN')}đ đã vào ví khả dụng.`,
      type: 'transaction_completed',
      relatedId: tx._id.toString(),
    });

    const [buyer, ticket] = await Promise.all([
      User.findById(tx.buyerId),
      Ticket.findById(tx.ticketId),
    ]);
    if (buyer) await emailService.transactionCompleted(buyer, ticket, tx.totalPrice);

    return res.json(success('Giao dịch hoàn tất — tiền đã vào ví người bán', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

const cancelTransaction = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));

    const isBuyer = tx.buyerId.toString() === req.user.id;
    if (!isBuyer && req.user.role !== 'admin') return res.status(403).json(error('Không có quyền hủy giao dịch này'));
    if (tx.transactionStatus === 'completed') return res.status(400).json(error('Không thể hủy giao dịch đã hoàn tất'));
    if (tx.transactionStatus === 'cancelled') return res.status(400).json(error('Giao dịch đã bị hủy rồi'));

    if (tx.paymentStatus === 'paid' && !tx.sellerCredited) {
      await reversePendingBalance(tx.sellerId, tx.sellerAmount);

      const ticket = await Ticket.findById(tx.ticketId);
      if (ticket) {
        ticket.quantity += tx.quantity;
        if (ticket.status === 'sold') ticket.status = 'available';
        await ticket.save();
      }
    }

    tx.transactionStatus = 'cancelled';
    tx.paymentStatus = 'failed';
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

const getMyPurchases = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ buyerId: req.user.id })
      .populate('ticketId', 'title category location ticketImage eventDate')
      .populate('sellerId', 'name avatar rating')
      .sort({ createdAt: -1 });
    return res.json(success('Lịch sử mua vé', { transactions }));
  } catch (err) {
    next(err);
  }
};

const getMySales = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ sellerId: req.user.id })
      .populate('ticketId', 'title category location ticketImage eventDate')
      .populate('buyerId', 'name avatar')
      .sort({ createdAt: -1 });
    return res.json(success('Lịch sử bán vé', { transactions }));
  } catch (err) {
    next(err);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const tx = await Transaction.findById(req.params.id)
      .populate('ticketId')
      .populate('buyerId', 'name email avatar phone')
      .populate('sellerId', 'name email avatar phone');
    if (!tx) return res.status(404).json(error('Không tìm thấy giao dịch'));

    const isBuyer  = tx.buyerId._id.toString() === req.user.id;
    const isSeller = tx.sellerId._id.toString() === req.user.id;
    if (!isBuyer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json(error('Không có quyền xem giao dịch này'));
    }
    return res.json(success('Chi tiết giao dịch', { transaction: tx }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransaction, payTransaction, completeTransaction,
  cancelTransaction, getMyPurchases, getMySales, getTransactionById,
};
