const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    buyerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    sellerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
    ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    quantity:   { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },

    // Payment note = buyer's name (used as bank transfer description)
    paymentNote: { type: String, default: '' },

    // 5-minute expiry window from creation
    paymentExpiredAt: { type: Date },

    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'momo', 'vnpay', 'qr_transfer', 'wallet'],
      default: 'qr_transfer',
    },

    // Primary status driving the entire flow
    status: {
      type: String,
      enum: [
        'pending_payment',       // Created, waiting user to transfer
        'waiting_admin_confirm', // User clicked "Tôi đã chuyển khoản"
        'paid',                  // Admin confirmed money received
        'completed',             // Seller credited, flow finished
        'failed',                // Admin rejected
        'expired',               // 5-min window passed without user action
      ],
      default: 'pending_payment',
    },

    platformFee:    { type: Number, default: 0 },
    sellerAmount:   { type: Number, default: 0 },
    sellerCredited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
