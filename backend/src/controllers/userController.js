const User = require('../models/User');
const Ticket = require('../models/Ticket');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const trustScoreService = require('../services/trustScoreService');
const { success, error } = require('../utils/apiResponse');

// GET /api/users/profile  — profile của chính mình + stats
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json(error('Không tìm thấy người dùng'));

    const [ticketsPosted, ticketsSold] = await Promise.all([
      Ticket.countDocuments({ ownerId: userId }),
      Transaction.countDocuments({ sellerId: userId, transactionStatus: 'completed' }),
    ]);

    return res.json(success('Thông tin profile', {
      user,
      stats: { ticketsPosted, ticketsSold },
    }));
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/profile  — cập nhật thông tin (name, phone, bio, location, avatar)
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, location } = req.body;
    const update = {};
    if (name !== undefined && name !== '') update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (bio !== undefined) update.bio = bio;
    if (location !== undefined) update.location = location;
    if (req.file) update.avatar = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
    return res.json(success('Cập nhật profile thành công', { user }));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/seller/:id  — thông tin cơ bản người bán (legacy)
const getSellerProfile = async (req, res, next) => {
  try {
    const seller = await User.findById(req.params.id);
    if (!seller) return res.status(404).json(error('Không tìm thấy người dùng'));
    return res.json(success('Thông tin seller', { user: seller }));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/reviews
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

// GET /api/users/public/:id  — hồ sơ công khai đầy đủ
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(
      req.params.id,
      'name avatar bio location rating reviewCount verified isPro proBadge createdAt trustScore isActive'
    );
    if (!user) return res.status(404).json(error('Không tìm thấy người dùng'));
    if (!user.isActive) return res.status(404).json(error('Tài khoản này không còn hoạt động'));

    const trustScore = await trustScoreService.update(req.params.id);

    const [totalPosted, totalSold, activeListings, reviews] = await Promise.all([
      Ticket.countDocuments({ ownerId: req.params.id }),
      Transaction.countDocuments({ sellerId: req.params.id, transactionStatus: 'completed' }),
      Ticket.find({ ownerId: req.params.id, verifyStatus: 'verified', status: 'available' })
        .select('title category resalePrice originalPrice eventDate location ticketImage ownerId')
        .sort({ createdAt: -1 })
        .limit(9),
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
