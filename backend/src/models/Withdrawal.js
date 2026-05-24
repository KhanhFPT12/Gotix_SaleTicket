const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount:          { type: Number, required: true, min: 1000 },
    bankName:        { type: String, required: true, trim: true },
    bankAccount:     { type: String, required: true, trim: true },
    bankAccountName: { type: String, required: true, trim: true },
    status:          { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote:       { type: String, default: '' },
    processedAt:     { type: Date },
    processedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
