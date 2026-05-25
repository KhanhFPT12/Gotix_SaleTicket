const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:    { type: String, required: true, minlength: 6, select: false },
    phone:       { type: String, trim: true },
    avatar:      { type: String, default: '' },
    bio:         { type: String, default: '', maxlength: 500 },
    location:    { type: String, default: '', trim: true },
    role:        { type: String, enum: ['user', 'admin'], default: 'user' },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    verified:    { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    availableBalance: { type: Number, default: 0, min: 0 },
    pendingBalance:   { type: Number, default: 0, min: 0 },
    totalRevenue:     { type: Number, default: 0, min: 0 },
    violationCount: { type: Number, default: 0 },
    trustScore:     { type: Number, default: 50 },
    isPro:       { type: Boolean, default: false },
    proPlan:     { type: String, enum: ['none', '1_month', '3_months', '6_months', '1_year'], default: 'none' },
    proStartDate: { type: Date },
    proEndDate:   { type: Date },
    proBadge:    { type: String, default: 'GoTix Pro' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
