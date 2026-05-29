const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject:      { type: String, required: true, trim: true },
    topic: {
      type: String, required: true,
      enum: ['payment', 'ticket_issue', 'not_received', 'withdrawal', 'account', 'report_user', 'other'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'closed'],
      default: 'pending',
    },
    lastMessage:   { type: String, default: '' },
    lastMessageAt: { type: Date },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByUser:  { type: Number, default: 0 },
    assignedTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
