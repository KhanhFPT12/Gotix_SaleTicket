const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const pendingSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },   // pre-hashed
  phone:    { type: String, default: '' },
  token:    { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// MongoDB TTL: tự xóa sau 24 giờ nếu chưa xác minh
pendingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });
// Unique email index
pendingSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('PendingRegistration', pendingSchema);
