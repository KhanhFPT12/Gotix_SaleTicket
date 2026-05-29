const TopUp = require('../models/TopUp');
const User = require('../models/User');
const adminBank = require('../config/adminBank');
const { success, error } = require('../utils/apiResponse');
const { notify } = require('../services/notificationService');

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
      status:       'pending',
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

const vnpayReturnTopUp = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    const verifyResult = verifyReturnUrl(vnp_Params);

    if (verifyResult.isSuccess) {
      const topUpId = vnp_Params['vnp_TxnRef'];
      const topUp = await TopUp.findById(topUpId);
      
      if (!topUp) {
        return res.status(404).json(error('Không tìm thấy lệnh nạp tiền'));
      }

      if (topUp.status === 'pending') {
        // Update user balance
        await User.findByIdAndUpdate(topUp.userId, {
          $inc: { availableBalance: topUp.amount, totalRevenue: topUp.amount },
        });

        // Update top-up status
        topUp.status = 'approved';
        topUp.processedAt = new Date();
        // Since it's automated, processedBy could be left null or set to a system admin ID if necessary
        await topUp.save();

        // Send notification
        await notify({
          receiverId: topUp.userId,
          title: 'Nạp tiền thành công',
          message: `${topUp.amount?.toLocaleString('vi-VN')}đ đã được cộng vào ví của bạn từ VNPay.`,
          type: 'wallet_credited',
          relatedId: topUp._id.toString(),
        });
      }

      return res.json(success('Nạp tiền thành công', { topUpId: topUp._id }));
    } else {
      return res.status(400).json(error('Thanh toán thất bại hoặc mã xác thực không hợp lệ', { code: verifyResult.code }));
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getAdminBankInfo, createTopUp, getMyTopUps, vnpayReturnTopUp };
