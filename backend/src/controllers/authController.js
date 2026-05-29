const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const emailService = require('../services/emailService');
const { success, error } = require('../utils/apiResponse');

const COOKIE_OPTS = { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' };

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(error('Validation thất bại', errors.array()));
    }
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email })) {
      return res.status(409).json(error('Email đã được sử dụng'));
    }

    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      name, email, password, phone, role: 'user',
      emailVerified:            false,
      emailVerificationToken:   verifyToken,
      emailVerificationExpires: verifyExpires,
    });

    // Fire-and-forget — don't block response if email fails
    emailService.verifyEmail(user, verifyToken).catch(e =>
      console.error('[emailService] verifyEmail failed:', e.message)
    );

    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTS);
    return res.status(201).json(success(
      'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
      { user, token, requireEmailVerification: true }
    ));
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(error('Validation thất bại', errors.array()));
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(error('Email hoặc mật khẩu không đúng'));
    }
    if (!user.isActive) {
      return res.status(403).json(error(
        'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.',
        { code: 'ACCOUNT_DISABLED' }
      ));
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTS);
    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = user._id.toString();
    return res.json(success('Đăng nhập thành công', { user: userObj, token }));
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.json(success('Đăng xuất thành công'));
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    return res.json(success('Thông tin tài khoản', { user }));
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json(error('Vui lòng nhập đầy đủ mật khẩu'));
    }
    if (newPassword.length < 6) {
      return res.status(400).json(error('Mật khẩu mới ít nhất 6 ký tự'));
    }
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(oldPassword))) {
      return res.status(400).json(error('Mật khẩu hiện tại không đúng'));
    }
    user.password = newPassword;
    await user.save();
    return res.json(success('Đổi mật khẩu thành công'));
  } catch (err) {
    next(err);
  }
};

// GET /auth/verify-email/:token
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerificationToken:   token,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json(error(
        'Link xác nhận không hợp lệ hoặc đã hết hạn.',
        { code: 'INVALID_TOKEN' }
      ));
    }
    if (user.emailVerified) {
      return res.json(success('Tài khoản đã được xác minh trước đó.'));
    }

    user.emailVerified            = true;
    user.emailVerificationToken   = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json(success('Xác minh email thành công! Tài khoản của bạn đã được kích hoạt.'));
  } catch (err) {
    next(err);
  }
};

// POST /auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('+emailVerificationToken +emailVerificationExpires');
    if (!user) return res.status(404).json(error('Không tìm thấy tài khoản'));
    if (user.emailVerified) {
      return res.status(400).json(error('Tài khoản đã được xác minh rồi.'));
    }

    // Rate-limit: block if token was issued < 60s ago
    if (user.emailVerificationExpires) {
      const issuedMs  = user.emailVerificationExpires.getTime() - 24 * 60 * 60 * 1000;
      const elapsedMs = Date.now() - issuedMs;
      if (elapsedMs < 60_000) {
        return res.status(429).json(error('Vui lòng chờ ít nhất 1 phút trước khi gửi lại.'));
      }
    }

    const verifyToken   = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.emailVerificationToken   = verifyToken;
    user.emailVerificationExpires = verifyExpires;
    await user.save({ validateBeforeSave: false });

    await emailService.verifyEmail(user, verifyToken);
    return res.json(success('Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư.'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, login, logout, getMe, changePassword,
  verifyEmail, resendVerification,
};
