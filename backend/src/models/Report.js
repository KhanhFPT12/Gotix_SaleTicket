const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporterId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    reason:      { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status:      { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
