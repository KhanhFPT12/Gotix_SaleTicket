const mongoose = require('mongoose');

const topUpSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount:       { type: Number, required: true, min: 10000 },
    transferCode: { type: String, required: true, unique: true },
    status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminNote:    { type: String, default: '' },
    processedAt:  { type: Date },
    processedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TopUp', topUpSchema);
