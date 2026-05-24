const TopUp = require('../models/TopUp');
const adminBank = require('../config/adminBank');
const { success, error } = require('../utils/apiResponse');

function generateTransferCode(userId) {
  const uid   = userId.toString().slice(-5).toUpperCase();
  const ts    = Date.now().toString().slice(-5);
  return `GOTIX${uid}${ts}`;
}

const getAdminBankInfo = (req, res, next) => {
  try {
    return res.json(success('Thông tin ngân hàng', { bank: adminBank }));
  } catch (err) {
    next(err);
  }
};

const createTopUp = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const amt = Number(amount);
    if (!amt || amt < 10000) {
      return res.status(400).json(error('Số tiền nạp tối thiểu 10.000đ'));
    }

    const transferCode = generateTransferCode(req.user.id);

    const topUp = await TopUp.create({
      userId:       req.user.id,
      amount:       amt,
      transferCode,
    });

    return res.status(201).json(success('Tạo lệnh nạp tiền thành công', { topUp, transferCode }));
  } catch (err) {
    next(err);
  }
};

const getMyTopUps = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [topUps, total] = await Promise.all([
      TopUp.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TopUp.countDocuments({ userId: req.user.id }),
    ]);
    return res.json(success('Lịch sử nạp tiền', {
      topUps,
      pagination: { total, page: Number(page), limit: Number(limit) },
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = { getAdminBankInfo, createTopUp, getMyTopUps };
