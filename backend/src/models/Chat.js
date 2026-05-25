const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null },
    message:    { type: String, required: true, trim: true },
    isRead:     { type: Boolean, default: false },
    readAt:     { type: Date, default: null },
    isRecalled: { type: Boolean, default: false },
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions:  [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      emoji:  { type: String, required: true },
      _id:    false,
    }],
  },
  { timestamps: true }
);

chatSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
chatSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Chat', chatSchema);
