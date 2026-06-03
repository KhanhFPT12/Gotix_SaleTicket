const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, lowercase: true, trim: true },
  rawPassword: { type: String, required: true },  // raw plaintext — hashed when User is created
  phone:       { type: String, default: '' },
  otp:         { type: String, required: true },
  otpExpires:  { type: Date,   required: true },
  createdAt:   { type: Date,   default: Date.now },
});

// TTL: tự xóa sau 24h
pendingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
pendingSchema.index({ email: 1 },     { unique: true });

module.exports = mongoose.model('PendingRegistration', pendingSchema);
