const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    message:    { type: String, required: true, trim: true },
    isRead:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
