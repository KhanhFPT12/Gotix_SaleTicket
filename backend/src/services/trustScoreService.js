const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');

async function compute(userId) {
  const [user, successfulSales, reviews] = await Promise.all([
    User.findById(userId),
    Transaction.countDocuments({ sellerId: userId, transactionStatus: 'completed' }),
    Review.find({ sellerId: userId }),
  ]);

  if (!user) return 50;

  let score = 40; // base

  // Rating component (max +25)
  if (user.reviewCount > 0) score += Math.round(user.rating * 5);

  // Successful sales (max +20)
  score += Math.min(20, successfulSales * 2);

  // Pro bonus (+5)
  if (user.isPro) score += 5;

  // Account age (max +10): +1 per 30 days up to 10
  const ageInDays = Math.floor((Date.now() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
  score += Math.min(10, Math.floor(ageInDays / 30));

  // Violations penalty (-10 per violation)
  score -= (user.violationCount || 0) * 10;

  score = Math.max(0, Math.min(100, score));
  return score;
}

async function update(userId) {
  const score = await compute(userId);
  await User.findByIdAndUpdate(userId, { trustScore: score });
  return score;
}

module.exports = { compute, update };
