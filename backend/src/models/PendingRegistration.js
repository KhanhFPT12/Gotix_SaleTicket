const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, lowercase: true, trim: true },
  password:   { type: String, required: true },  // pre-hashed
  phone:      { type: String, default: '' },
  otp:        { type: String, required: true },   // 6 chữ số
  otpExpires: { type: Date,   required: true },   // hết hạn sau 10 phút
  createdAt:  { type: Date,   default: Date.now },
});

// MongoDB TTL: tự xóa sau 24h nếu không hoàn thành đăng ký
pendingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
pendingSchema.index({ email: 1 },     { unique: true });

module.exports = mongoose.model('PendingRegistration', pendingSchema);
