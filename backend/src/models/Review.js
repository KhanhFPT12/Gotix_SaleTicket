const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    buyerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true, unique: true },
    rating:        { type: Number, required: true, min: 1, max: 5 },
    comment:       { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
