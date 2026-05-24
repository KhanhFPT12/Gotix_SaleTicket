const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const { deductAvailableBalance } = require('../services/walletService');
const { success, error } = require('../utils/apiResponse');

const createWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankName, bankAccount, bankAccountName } = req.body;
    const amt = Number(amount);

    if (!amt || amt < 1000) {
      return res.status(400).json(error('Số tiền rút tối thiểu 1.000đ'));
    }
    if (!bankName || !bankAccount || !bankAccountName) {
      return res.status(400).json(error('Vui lòng nhập đầy đủ thông tin ngân hàng'));
    }

    await deductAvailableBalance(req.user.id, amt);

    const withdrawal = await Withdrawal.create({
      userId: req.user.id, amount: amt, bankName, bankAccount, bankAccountName,
    });

    return res.status(201).json(success('Tạo yêu cầu rút tiền thành công', { withdrawal }));
  } catch (err) {
    next(err);
  }
};

const getMyWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [withdrawals, total] = await Promise.all([
      Withdrawal.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Withdrawal.countDocuments({ userId: req.user.id }),
    ]);
    return res.json(success('Lịch sử rút tiền', {
      withdrawals,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = { createWithdrawal, getMyWithdrawals };
