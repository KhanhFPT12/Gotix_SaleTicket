const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { success, error } = require('../utils/apiResponse');

const createReview = async (req, res, next) => {
  try {
    const { sellerId, ticketId, transactionId, rating, comment } = req.body;

    const tx = await Transaction.findOne({
      _id: transactionId,
      buyerId: req.user.id,
      transactionStatus: 'completed',
    });
    if (!tx) {
      return res.status(403).json(error('Chỉ đánh giá được sau khi giao dịch hoàn thành'));
    }

    const existing = await Review.findOne({ transactionId });
    if (existing) {
      return res.status(409).json(error('Bạn đã đánh giá giao dịch này'));
    }

    const review = await Review.create({
      buyerId: req.user.id,
      sellerId,
      ticketId,
      transactionId,
      rating: Number(rating),
      comment,
    });

    const allReviews = await Review.find({ sellerId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(sellerId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: allReviews.length,
    });

    return res.status(201).json(success('Đánh giá thành công', { review }));
  } catch (err) {
    next(err);
  }
};

const getSellerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId })
      .populate('buyerId', 'name avatar')
      .populate('ticketId', 'title category')
      .sort({ createdAt: -1 });
    return res.json(success('Đánh giá của seller', { reviews }));
  } catch (err) {
    next(err);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ buyerId: req.user.id })
      .populate('ticketId', 'title category')
      .populate('sellerId', 'name avatar')
      .sort({ createdAt: -1 });
    return res.json(success('Đánh giá của tôi', { reviews }));
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, getSellerReviews, getMyReviews };
