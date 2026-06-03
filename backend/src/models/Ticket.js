const mongoose = require('mongoose');

const detailsSchema = new mongoose.Schema(
  {
    movieTitle: String, cinemaName: String, cinemaAddress: String,
    room: String, seats: [String], showDate: String, showTime: String,
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true },
    category:      { type: String, required: true, enum: ['movie'] },
    description:   { type: String, trim: true },
    location:      { type: String, required: true, trim: true },
    city:          { type: String, trim: true },
    eventDate:     { type: String },
    eventTime:     { type: String },
    originalPrice: { type: Number, required: true, min: 0 },
    resalePrice:   { type: Number, required: true, min: 0 },
    quantity:      { type: Number, required: true, min: 0 },
    status:        { type: String, enum: ['available', 'reserved', 'sold', 'cancelled', 'expired', 'hidden'], default: 'available' },
    verifyStatus:  { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    ownerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketImage:   { type: String, default: '' },
    qrImage:       { type: String, default: '' },
    details:       detailsSchema,
    views:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

ticketSchema.index({ title: 'text', location: 'text' });

module.exports = mongoose.model('Ticket', ticketSchema);
