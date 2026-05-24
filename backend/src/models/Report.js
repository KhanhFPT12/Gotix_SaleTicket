const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    reason: {
      type: String,
      enum: ['fake_ticket', 'invalid_qr', 'seller_unresponsive', 'wrong_info', 'transaction_issue', 'other'],
      required: true,
    },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'requesting_evidence', 'resolved', 'rejected'],
      default: 'pending',
    },
    resolution:  { type: String, trim: true, default: '' },
    adminNote:   { type: String, trim: true, default: '' },
    refundIssued: { type: Boolean, default: false },
    resolvedAt:  { type: Date },
    resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
