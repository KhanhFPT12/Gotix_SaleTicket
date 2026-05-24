const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const trustScoreService = require('../services/trustScoreService');
const { success, error } = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return res.json(success('Thông tin profile', { user }));
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;
    if (req.file) update.avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
    return res.json(success('Cập nhật profile thành công', { user }));
  } catch (err) {
    next(err);
  }
};

const getSellerProfile = async (req, res, next) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json(error('Không tìm thấy người dùng'));
    return res.json(success('Thông tin seller', { user: seller }));
  } catch (err) {
    next(err);
  }
};

const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.id })
      .populate('buyerId', 'name avatar')
      .populate('ticketId', 'title category')
      .sort({ createdAt: -1 });
    return res.json(success('Đánh giá của seller', { reviews }));
  } catch (err) {
    next(err);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id,
      'name avatar rating reviewCount verified isPro proBadge createdAt trustScore violationCount'
    );
    if (!user) return res.status(404).json(error('Không tìm thấy người dùng'));

    // Recompute and save trustScore
    const trustScore = await trustScoreService.update(req.params.id);

    const [totalPosted, totalSold, activeListings, reviews] = await Promise.all([
      Ticket.countDocuments({ ownerId: req.params.id }),
      Transaction.countDocuments({ sellerId: req.params.id, transactionStatus: 'completed' }),
      Ticket.find({ ownerId: req.params.id, verifyStatus: 'verified', status: 'available' })
        .sort({ createdAt: -1 })
        .limit(6),
      Review.find({ sellerId: req.params.id })
        .populate('buyerId', 'name avatar')
        .populate('ticketId', 'title category')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.json(success('Hồ sơ người dùng', {
      user: { ...user.toObject(), trustScore },
      stats: { totalPosted, totalSold, totalSuccessful: totalSold },
      activeListings,
      reviews,
    }));
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile, getSellerProfile, getUserReviews, getPublicProfile };
