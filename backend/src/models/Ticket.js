const mongoose = require('mongoose');

const detailsSchema = new mongoose.Schema(
  {
    movieTitle: String, cinemaName: String, cinemaAddress: String,
    room: String, seats: [String], showDate: String, showTime: String,
    artistName: String, concertName: String,
    eventName: String, organizer: String,
    matchName: String, stadium: String,
    seatZone: String, gate: String,
    workshopName: String, speaker: String, venue: String,
    departure: String, destination: String, departureTime: String,
    busCompany: String, seatNumber: String, tripCode: String,
    trainCode: String, coach: String,
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title:         { type: String, required: true, trim: true },
    category:      { type: String, required: true, enum: ['movie', 'concert', 'event', 'sport', 'workshop', 'bus', 'train'] },
    description:   { type: String, trim: true },
    location:      { type: String, required: true, trim: true },
    eventDate:     { type: String },
    eventTime:     { type: String },
    originalPrice: { type: Number, required: true, min: 0 },
    resalePrice:   { type: Number, required: true, min: 0 },
    quantity:      { type: Number, required: true, min: 0 },
    status:        { type: String, enum: ['available', 'reserved', 'sold', 'cancelled'], default: 'available' },
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
