const User            = require('../models/User');
const ProSubscription = require('../models/ProSubscription');
const { success, error } = require('../utils/apiResponse');
const { notify }      = require('../services/notificationService');

const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const PLANS = [
  { id: '1_month',  label: '1 Tháng', durationInDays: 30,  price: 39000  },
  { id: '3_months', label: '3 Tháng', durationInDays: 90,  price: 89000  },
  { id: '6_months', label: '6 Tháng', durationInDays: 180, price: 149000 },
  { id: '1_year',   label: '1 Năm',   durationInDays: 365, price: 299000 },
];

const getPlans = async (req, res, next) => {
  try {
    return res.json(success('Danh sách gói Pro', { plans: PLANS }));
  } catch (err) { next(err); }
};

// User selects a plan → create pending subscription, return QR info
const upgradePro = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const planInfo = PLANS.find(p => p.id === plan);
    if (!planInfo) return res.status(400).json(error('Gói không hợp lệ'));

    const now  = new Date();
    const user = await User.findById(req.user.id);

    const startDate = (user.isPro && user.proEndDate && user.proEndDate > now)
      ? user.proEndDate
      : now;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planInfo.durationInDays);

    const subscription = await ProSubscription.create({
      userId:           req.user.id,
      plan:             planInfo.id,
      price:            planInfo.price,
      durationInDays:   planInfo.durationInDays,
      startDate,
      endDate,
      paymentNote:      req.user.name || '',
      paymentExpiredAt: new Date(Date.now() + PAYMENT_EXPIRY_MS),
      paymentStatus:    'pending_payment',
      status:           'pending',
    });

    return res.json(success('Tạo đơn nâng cấp Pro thành công', {
      subscription,
      paymentNote: subscription.paymentNote,
    }));
  } catch (err) { next(err); }
};

// User clicks "Tôi đã chuyển khoản"
const confirmUserPaidPro = async (req, res, next) => {
  try {
    const sub = await ProSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json(error('Không tìm thấy đơn nâng cấp'));
    if (sub.userId.toString() !== req.user.id) return res.status(403).json(error('Không có quyền'));
    if (sub.paymentStatus !== 'pending_payment') {
      return res.status(400).json(error('Đơn không ở trạng thái chờ thanh toán'));
    }
    if (sub.paymentExpiredAt && new Date() > sub.paymentExpiredAt) {
      sub.paymentStatus = 'expired';
      await sub.save();
      return res.status(400).json(error('Đã hết thời gian thanh toán'));
    }

    sub.paymentStatus = 'waiting_admin_confirm';
    await sub.save();

    return res.json(success('Đã ghi nhận — chờ GoTix xác minh', { subscription: sub }));
  } catch (err) { next(err); }
};

// Admin confirms payment received → activate Pro
const adminConfirmPro = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(error('Không có quyền'));

    const sub = await ProSubscription.findById(req.params.id).populate('userId', 'name email');
    if (!sub) return res.status(404).json(error('Không tìm thấy đơn nâng cấp'));
    if (sub.paymentStatus !== 'waiting_admin_confirm') {
      return res.status(400).json(error('Đơn không ở trạng thái chờ xác nhận'));
    }

    sub.paymentStatus = 'paid';
    sub.status        = 'active';
    await sub.save();

    await User.findByIdAndUpdate(sub.userId, {
      isPro:       true,
      proPlan:     sub.plan,
      proStartDate: sub.startDate,
      proEndDate:   sub.endDate,
    });

    await notify({
      receiverId: sub.userId._id ?? sub.userId,
      title:   'Nâng cấp Pro thành công!',
      message: `Tài khoản GoTix Pro của bạn đã được kích hoạt đến ${sub.endDate.toLocaleDateString('vi-VN')}.`,
      type:    'pro_activated',
      relatedId: sub._id.toString(),
    });

    return res.json(success('Xác nhận Pro thành công', { subscription: sub }));
  } catch (err) { next(err); }
};

// Admin rejects
const adminRejectPro = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json(error('Không có quyền'));

    const sub = await ProSubscription.findById(req.params.id);
    if (!sub) return res.status(404).json(error('Không tìm thấy đơn nâng cấp'));
    if (!['waiting_admin_confirm', 'pending_payment'].includes(sub.paymentStatus)) {
      return res.status(400).json(error('Không thể từ chối ở trạng thái này'));
    }

    sub.paymentStatus = 'failed';
    sub.status        = 'cancelled';
    await sub.save();

    await notify({
      receiverId: sub.userId,
      title:   'Thanh toán Pro bị từ chối',
      message: 'GoTix không xác nhận được giao dịch. Vui lòng liên hệ hỗ trợ.',
      type:    'pro_failed',
      relatedId: sub._id.toString(),
    });

    return res.json(success('Đã từ chối đơn nâng cấp Pro', { subscription: sub }));
  } catch (err) { next(err); }
};

const getMySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.isPro && user.proEndDate && user.proEndDate < new Date()) {
      await User.findByIdAndUpdate(req.user.id, { isPro: false, proPlan: 'none' });
      await ProSubscription.updateMany(
        { userId: req.user.id, status: 'active' },
        { status: 'expired', paymentStatus: 'expired' }
      );
      user.isPro = false;
      user.proPlan = 'none';
    }
    const subscription = await ProSubscription.findOne(
      { userId: req.user.id, status: 'active', paymentStatus: 'paid' },
      null,
      { sort: { createdAt: -1 } }
    );
    return res.json(success('Thông tin gói Pro', { user, subscription, plans: PLANS }));
  } catch (err) { next(err); }
};

const cancelPro = async (req, res, next) => {
  try {
    await ProSubscription.updateMany(
      { userId: req.user.id, status: 'active' },
      { status: 'cancelled' }
    );
    await User.findByIdAndUpdate(req.user.id, {
      isPro: false, proPlan: 'none', proEndDate: null, proStartDate: null,
    });
    return res.json(success('Đã hủy gói Pro'));
  } catch (err) { next(err); }
};

// Admin: list all pending Pro subscriptions
const getAdminProSubscriptions = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { paymentStatus: status } : {};
    const subs = await ProSubscription.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(200);
    return res.json(success('Danh sách đăng ký Pro', { subscriptions: subs }));
  } catch (err) { next(err); }
};

module.exports = {
  getPlans, upgradePro, confirmUserPaidPro,
  adminConfirmPro, adminRejectPro,
  getMySubscription, cancelPro,
  getAdminProSubscriptions,
};
