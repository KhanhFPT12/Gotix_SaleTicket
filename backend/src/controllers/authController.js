const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User                = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const generateToken       = require('../utils/generateToken');
const emailService        = require('../services/emailService');
const { success, error }  = require('../utils/apiResponse');

const COOKIE_OPTS  = { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' };
const OTP_EXPIRE   = 10 * 60 * 1000; // 10 phút
const OTP_COOLDOWN = 60 * 1000;      // resend tối thiểu cách 60 giây

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── REGISTER — lưu tạm + gửi OTP ─────────────────────────────────────────────
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp        = generateOtp();
    const otpExpires = new Date(Date.now() + OTP_EXPIRE);

    // Xóa pending cũ (nếu đăng ký lại)
    await PendingRegistration.deleteOne({ email });

    await PendingRegistration.create({
      name, email, phone: phone || '',
      password: hashedPassword,
      otp, otpExpires,
    });

    // Gửi OTP qua email — fire-and-forget
    emailService.sendOtp({ name, email }, otp).catch(e =>
      console.error('[emailService] sendOtp failed:', e.message)
    );

    return res.status(201).json(success(
      'Mã OTP đã được gửi đến email của bạn.',
      { requireOtp: true, email }
    ));
  } catch (err) {
    next(err);
  }
};

// ── VERIFY OTP — kiểm tra OTP + tạo User thật ────────────────────────────────
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json(error('Vui lòng cung cấp email và mã OTP'));
    }

    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return res.status(400).json(error(
        'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.',
        { code: 'NO_PENDING' }
      ));
    }

    if (new Date() > pending.otpExpires) {
      await PendingRegistration.deleteOne({ email });
      return res.status(400).json(error(
        'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.',
        { code: 'OTP_EXPIRED' }
      ));
    }

    if (pending.otp !== String(otp).trim()) {
      return res.status(400).json(error('Mã OTP không đúng. Vui lòng kiểm tra lại.'));
    }

    // OTP đúng — tạo User thật
    if (await User.findOne({ email: pending.email })) {
      await PendingRegistration.deleteOne({ email });
      return res.status(409).json(error('Email này đã được sử dụng bởi tài khoản khác.'));
    }

    const user = new User({
      name:          pending.name,
      email:         pending.email,
      phone:         pending.phone,
      role:          'user',
      emailVerified: true,
    });
    user.$set({ password: pending.password });
    await user.save({ validateBeforeSave: false });

    await PendingRegistration.deleteOne({ email });

    // Auto-login sau khi tạo tài khoản thành công
    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTS);
    const userObj = user.toObject();
    userObj.id = user._id.toString();

    return res.status(201).json(success(
      'Tạo tài khoản thành công! Chào mừng bạn đến với GoTix.',
      { user: userObj, token }
    ));
  } catch (err) {
    next(err);
  }
};

// ── RESEND OTP ────────────────────────────────────────────────────────────────
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json(error('Vui lòng cung cấp email'));

    const pending = await PendingRegistration.findOne({ email });
    if (!pending) {
      return res.status(404).json(error('Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.'));
    }

    // Rate-limit
    const elapsed = Date.now() - pending.createdAt.getTime();
    if (elapsed < OTP_COOLDOWN) {
      return res.status(429).json(error('Vui lòng chờ ít nhất 1 phút trước khi gửi lại.'));
    }

    const otp        = generateOtp();
    const otpExpires = new Date(Date.now() + OTP_EXPIRE);
    pending.otp        = otp;
    pending.otpExpires = otpExpires;
    pending.createdAt  = new Date(); // reset cooldown timer
    await pending.save();

    await emailService.sendOtp({ name: pending.name, email: pending.email }, otp);
    return res.json(success('Mã OTP mới đã được gửi. Vui lòng kiểm tra hộp thư.'));
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
      const pending = await PendingRegistration.findOne({ email });
      if (pending) {
        return res.status(403).json(error(
          'Tài khoản chưa được xác minh. Vui lòng nhập mã OTP đã gửi tới email của bạn.',
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

    if (!user.emailVerified) {
      return res.status(403).json(error(
        'Vui lòng hoàn tất xác minh tài khoản trước khi đăng nhập.',
        { code: 'EMAIL_NOT_VERIFIED', email: user.email }
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

// ── Giữ lại verifyEmail (backward-compat cho link cũ) ────────────────────────
const verifyEmail = async (req, res, next) => {
  return res.status(410).json(error(
    'Link xác nhận này không còn được sử dụng. Vui lòng đăng ký lại với luồng mã OTP mới.',
    { code: 'DEPRECATED' }
  ));
};

// Alias cũ — không còn dùng
const resendVerification = resendOtp;

module.exports = {
  register, login, logout, getMe, changePassword,
  verifyOtp, resendOtp,
  verifyEmail, resendVerification,
};
