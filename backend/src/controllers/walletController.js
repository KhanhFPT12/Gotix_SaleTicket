const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const { success } = require('../utils/apiResponse');

const getMyWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id,
      'availableBalance pendingBalance totalRevenue'
    );
    return res.json(success('Thông tin ví', {
      availableBalance: user.availableBalance,
      pendingBalance:   user.pendingBalance,
      totalRevenue:     user.totalRevenue,
    }));
  } catch (err) {
    next(err);
  }
};

// Lịch sử biến động ví: giao dịch bán + yêu cầu rút tiền
const getWalletHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [sales, withdrawals] = await Promise.all([
      Transaction.find({ sellerId: req.user.id, paymentStatus: 'paid' })
        .populate('ticketId', 'title category')
        .populate('buyerId', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Withdrawal.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    // Merge + sort by date for a unified feed
    const txEntries = sales.map(tx => ({
      type:       'sale',
      id:         tx._id,
      amount:     tx.sellerAmount,
      totalPrice: tx.totalPrice,
      platformFee: tx.platformFee,
      status:     tx.transactionStatus,
      paymentStatus: tx.paymentStatus,
      title:      tx.ticketId?.title ?? 'Vé',
      buyerName:  tx.buyerId?.name ?? 'Người mua',
      date:       tx.updatedAt,
    }));

    const wdEntries = withdrawals.map(wd => ({
      type:   'withdrawal',
      id:     wd._id,
      amount: wd.amount,
      status: wd.status,
      bank:   wd.bankName,
      note:   wd.adminNote,
      date:   wd.createdAt,
    }));

    const history = [...txEntries, ...wdEntries]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, Number(limit));

    return res.json(success('Lịch sử ví', { history }));
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyWallet, getWalletHistory };
