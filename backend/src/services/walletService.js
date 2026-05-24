const User = require('../models/User');

const PLATFORM_FEE_RATE = 0.05; // 5%

function computeFees(totalPrice) {
  const platformFee  = Math.round(totalPrice * PLATFORM_FEE_RATE);
  const sellerAmount = totalPrice - platformFee;
  return { platformFee, sellerAmount };
}

async function addPendingBalance(userId, amount) {
  await User.findByIdAndUpdate(
    userId,
    { $inc: { pendingBalance: amount, totalRevenue: amount } }
  );
}

async function releasePendingToAvailable(userId, amount) {
  await User.findByIdAndUpdate(
    userId,
    { $inc: { pendingBalance: -amount, availableBalance: amount } }
  );
}

async function reversePendingBalance(userId, amount) {
  await User.findByIdAndUpdate(
    userId,
    { $inc: { pendingBalance: -amount, totalRevenue: -amount } }
  );
}

async function deductAvailableBalance(userId, amount) {
  const user = await User.findById(userId);
  if (!user || user.availableBalance < amount) {
    throw new Error('Số dư khả dụng không đủ');
  }
  await User.findByIdAndUpdate(userId, { $inc: { availableBalance: -amount } });
}

module.exports = {
  PLATFORM_FEE_RATE,
  computeFees,
  addPendingBalance,
  releasePendingToAvailable,
  reversePendingBalance,
  deductAvailableBalance,
};
