const mongoose = require('mongoose');

const proSubscriptionSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plan:            { type: String, enum: ['1_month', '3_months', '6_months', '1_year'], required: true },
    price:           { type: Number, required: true },
    durationInDays:  { type: Number, required: true },
    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },
    paymentStatus:   { type: String, enum: ['pending', 'paid', 'failed', 'expired'], default: 'pending' },
    status:          { type: String, enum: ['pending', 'active', 'expired', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProSubscription', proSubscriptionSchema);
