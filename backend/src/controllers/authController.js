const crypto   = require('crypto');
const bcrypt   = require('bcryptjs');
const { validationResult } = require('express-validator');
const User                 = require('../models/User');
const PendingRegistration  = require('../models/PendingRegistration');
const generateToken        = require('../utils/generateToken');
const emailService         = require('../services/emailService');
const { success, error }   = require('../utils/apiResponse');

const COOKIE_OPTS = { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' };

// ── REGISTER — lưu tạm, gửi email, CHƯA tạo user thật ───────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(error('Validation thất bại', errors.array()));
    }
    const { name, email, password, phone } = req.body;

    // Email đã có trong User thật
    if (await User.findOne({ email })) {
      return res.status(409).json(error('Email đã được sử dụng'));
    }

    // Hash mật khẩu trước khi lưu tạm
    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken    = crypto.randomBytes(32).toString('hex');

    // Xóa pending cũ nếu có (user đăng ký lại)
    await PendingRegistration.deleteOne({ email });

    await PendingRegistration.create({
      name, email, phone: phone || '',
      password: hashedPassword,
      token:    verifyToken,
    });

    // Gửi email xác nhận
    emailService.welcomeAndVerify({ name, email }, verifyToken).catch(e =>
      console.error('[emailService] welcomeAndVerify failed:', e.message)
    );

    return res.status(201).json(success(
      'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
      { requireEmailVerification: true, email }
    ));
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(error('Validation thất bại', errors.array()));
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      // Kiểm tra có phải chưa xác minh email không
      const pending = await PendingRegistration.findOne({ email });
      if (pending) {
        return res.status(403).json(error(
          'Tài khoản chưa được xác minh. Vui lòng kiểm tra email và bấm link xác nhận.',
          { code: 'EMAIL_NOT_VERIFIED', email }
        ));
      }
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

// ── VERIFY EMAIL — chỉ lúc này mới tạo User thật ────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Tìm trong pending
    const pending = await PendingRegistration.findOne({ token });

    // Nếu không có pending, kiểm tra xem đã tồn tại user chưa (xác minh lần 2)
    if (!pending) {
      const existingUser = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
      }).select('+emailVerificationToken +emailVerificationExpires');

      if (existingUser) {
        existingUser.emailVerified            = true;
        existingUser.emailVerificationToken   = undefined;
        existingUser.emailVerificationExpires = undefined;
        await existingUser.save({ validateBeforeSave: false });
        return res.json(success('Xác minh email thành công! Bạn có thể đăng nhập ngay.'));
      }

      // Kiểm tra user đã verified trước đó
      const alreadyVerified = await User.findOne({ emailVerified: true });
      if (alreadyVerified) {
        return res.json(success('Tài khoản đã được xác minh trước đó.'));
      }

      return res.status(400).json(error(
        'Link xác nhận không hợp lệ hoặc đã hết hạn.',
        { code: 'INVALID_TOKEN' }
      ));
    }

    // Kiểm tra email chưa bị đăng ký bởi người khác trong lúc chờ
    if (await User.findOne({ email: pending.email })) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).json(error('Email này đã được sử dụng bởi tài khoản khác.'));
    }

    // Tạo User thật — mật khẩu đã được hash sẵn trong pending
    const user = new User({
      name:         pending.name,
      email:        pending.email,
      phone:        pending.phone,
      role:         'user',
      emailVerified: true,
    });
    // Gán mật khẩu đã hash trực tiếp, bypass pre-save hook
    user.$set({ password: pending.password });
    // Tắt validation cho password vì bypass bcrypt hook
    await user.save({ validateBeforeSave: false });

    // Xóa pending
    await PendingRegistration.deleteOne({ _id: pending._id });

    return res.json(success('Xác minh email thành công! Tài khoản của bạn đã được tạo. Bạn có thể đăng nhập ngay.'));
  } catch (err) {
    next(err);
  }
};

// ── RESEND VERIFICATION — public endpoint ────────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const email = req.body?.email || req.user && (await User.findById(req.user.id))?.email;
    if (!email) return res.status(400).json(error('Vui lòng cung cấp email'));

    // Tìm trong pending
    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      // Kiểm tra có phải user đã verified rồi
      const user = await User.findOne({ email });
      if (user?.emailVerified) return res.status(400).json(error('Tài khoản đã được xác minh rồi.'));
      return res.status(404).json(error('Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.'));
    }

    // Rate-limit: createdAt phải cũ hơn 60 giây
    const elapsedMs = Date.now() - pending.createdAt.getTime();
    if (elapsedMs < 60_000) {
      return res.status(429).json(error('Vui lòng chờ ít nhất 1 phút trước khi gửi lại.'));
    }

    // Tạo token mới, reset thời gian tạo (reset TTL)
    const newToken = crypto.randomBytes(32).toString('hex');
    pending.token     = newToken;
    pending.createdAt = new Date();
    await pending.save();

    await emailService.verifyEmail({ name: pending.name, email: pending.email }, newToken);
    return res.json(success('Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư.'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register, login, logout, getMe, changePassword,
  verifyEmail, resendVerification,
};
