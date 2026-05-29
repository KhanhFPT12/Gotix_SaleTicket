const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true },
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    content:    { type: String, trim: true, default: '' },
    image:      { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
