const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    type:       {
      type: String,
      enum: [
        'ticket_submitted', 'ticket_approved', 'ticket_rejected',
        'ticket_sold', 'ticket_expired',
        'transaction_paid', 'transaction_completed', 'transaction_cancelled',
        'wallet_credited', 'withdrawal_approved', 'withdrawal_rejected',
        'chat_message', 'report_submitted', 'report_resolved',
      ],
      required: true,
    },
    isRead:    { type: Boolean, default: false },
    relatedId: { type: String, default: '' },
    link:      { type: String, default: '' },
  },
  { timestamps: true }
);

notificationSchema.index({ receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
