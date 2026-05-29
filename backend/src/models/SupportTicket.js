const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject:   { type: String, required: true, trim: true },
    topic: {
      type: String, required: true,
      enum: ['payment', 'buy_ticket', 'pass_ticket', 'withdrawal',
             'account', 'report_user', 'fake_ticket', 'other'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['new', 'pending', 'in_progress', 'waiting_customer', 'resolved', 'closed'],
      default: 'new',
    },
    lastMessage:    { type: String,  default: '' },
    lastMessageAt:  { type: Date },
    unreadByStaff:  { type: Number,  default: 0 },
    unreadByUser:   { type: Number,  default: 0 },
    assignedTo:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
