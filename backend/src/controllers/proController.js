const User = require('../models/User');
const ProSubscription = require('../models/ProSubscription');
const { success, error } = require('../utils/apiResponse');

const PLANS = [
  { id: '1_month',   label: '1 Tháng',   durationInDays: 30,  price: 39000  },
  { id: '3_months',  label: '3 Tháng',   durationInDays: 90,  price: 89000  },
  { id: '6_months',  label: '6 Tháng',   durationInDays: 180, price: 149000 },
  { id: '1_year',    label: '1 Năm',     durationInDays: 365, price: 299000 },
];

const getPlans = async (req, res, next) => {
  try {
    return res.json(success('Danh sách gói Pro', { plans: PLANS }));
  } catch (err) {
    next(err);
  }
};

const upgradePro = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const planInfo = PLANS.find(p => p.id === plan);
    if (!planInfo) return res.status(400).json(error('Gói không hợp lệ'));

    const now = new Date();
    const user = await User.findById(req.user.id);

    // If already Pro and not expired, extend from current endDate
    const startDate = (user.isPro && user.proEndDate && user.proEndDate > now)
      ? user.proEndDate
      : now;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planInfo.durationInDays);

    const subscription = await ProSubscription.create({
      userId: req.user.id,
      plan: planInfo.id,
      price: planInfo.price,
      durationInDays: planInfo.durationInDays,
      startDate,
      endDate,
      paymentStatus: 'paid',
      status: 'active',
    });

    await User.findByIdAndUpdate(req.user.id, {
      isPro: true,
      proPlan: planInfo.id,
      proStartDate: startDate,
      proEndDate: endDate,
    });

    const updatedUser = await User.findById(req.user.id);
    return res.json(success('Nâng cấp Pro thành công', { subscription, user: updatedUser }));
  } catch (err) {
    next(err);
  }
};

const getMySubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Auto-expire if past endDate
    if (user.isPro && user.proEndDate && user.proEndDate < new Date()) {
      await User.findByIdAndUpdate(req.user.id, {
        isPro: false,
        proPlan: 'none',
      });
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
  } catch (err) {
    next(err);
  }
};

const cancelPro = async (req, res, next) => {
  try {
    await ProSubscription.updateMany(
      { userId: req.user.id, status: 'active' },
      { status: 'cancelled' }
    );
    await User.findByIdAndUpdate(req.user.id, {
      isPro: false,
      proPlan: 'none',
      proEndDate: null,
      proStartDate: null,
    });
    return res.json(success('Đã hủy gói Pro'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getPlans, upgradePro, getMySubscription, cancelPro };
