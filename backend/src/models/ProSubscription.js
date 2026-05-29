const mongoose = require('mongoose');

const proSubscriptionSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan:           { type: String, enum: ['1_month', '3_months', '6_months', '1_year'], required: true },
    price:          { type: Number, required: true },
    durationInDays: { type: Number, required: true },
    startDate:      { type: Date, required: true },
    endDate:        { type: Date, required: true },

    // Buyer's name used as bank transfer description
    paymentNote:      { type: String, default: '' },
    // 5-minute window from creation
    paymentExpiredAt: { type: Date },

    paymentStatus: {
      type: String,
      enum: ['pending_payment', 'waiting_admin_confirm', 'paid', 'failed', 'expired'],
      default: 'pending_payment',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProSubscription', proSubscriptionSchema);
