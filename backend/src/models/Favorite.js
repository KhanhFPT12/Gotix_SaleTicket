const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, ticketId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
