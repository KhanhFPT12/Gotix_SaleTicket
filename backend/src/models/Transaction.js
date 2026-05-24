const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    buyerId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    quantity:          { type: Number, required: true, min: 1 },
    totalPrice:        { type: Number, required: true, min: 0 },
    paymentMethod:     { type: String, enum: ['cash', 'bank_transfer', 'momo', 'vnpay'], required: true },
    paymentStatus:     { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    transactionStatus: { type: String, enum: ['pending', 'completed', 'cancelled', 'disputed'], default: 'pending' },
    platformFee:       { type: Number, default: 0 },
    sellerAmount:      { type: Number, default: 0 },
    sellerCredited:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
