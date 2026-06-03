const { validationResult } = require('express-validator');
const User                = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const generateToken       = require('../utils/generateToken');
const emailService        = require('../services/emailService');
const { success, error }  = require('../utils/apiResponse');
const { OAuth2Client }    = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTS  = { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: 'lax' };
const OTP_EXPIRE   = 10 * 60 * 1000; // 10 phút
const OTP_COOLDOWN = 60 * 1000;      // resend tối thiểu 60 giây

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── REGISTER — lưu tạm rawPassword + gửi OTP ─────────────────────────────────
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

    const otp        = generateOtp();
    const otpExpires = new Date(Date.now() + OTP_EXPIRE);

    await PendingRegistration.deleteOne({ email });
    await PendingRegistration.create({
      name, email, phone: phone || '',
      rawPassword: password,   // lưu raw — User.create() sẽ hash khi tạo thật
      otp, otpExpires,
    });

    emailService.sendOtp({ name, email }, otp).catch(e =>
      console.error('[emailService] sendOtp failed:', e.message)
    );

    return res.status(201).json(success(
      'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      { requireOtp: true, email }
    ));
  } catch (err) {
    next(err);
  }
};

// ── VERIFY OTP — tạo User thật bằng User.create() (hash chuẩn) ───────────────
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
        'Mã OTP đã hết hạn (10 phút). Vui lòng yêu cầu gửi lại.',
        { code: 'OTP_EXPIRED' }
      ));
    }
    if (pending.otp !== String(otp).trim()) {
      return res.status(400).json(error('Mã OTP không đúng. Vui lòng kiểm tra lại.'));
    }
    if (await User.findOne({ email: pending.email })) {
      await PendingRegistration.deleteOne({ email });
      return res.status(409).json(error('Email này đã được sử dụng bởi tài khoản khác.'));
    }

    // Tạo User thật — dùng User.create() để pre-save hook hash password đúng 1 lần
    const user = await User.create({
      name:          pending.name,
      email:         pending.email,
      phone:         pending.phone,
      role:          'user',
      emailVerified: true,
      password:      pending.rawPassword, // raw → bcrypt hash chạy 1 lần duy nhất
    });

    await PendingRegistration.deleteOne({ email });

    // Auto-login
    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTS);
    const userObj = user.toObject();
    delete userObj.password;
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

    const elapsed = Date.now() - pending.createdAt.getTime();
    if (elapsed < OTP_COOLDOWN) {
      return res.status(429).json(error('Vui lòng chờ ít nhất 1 phút trước khi gửi lại.'));
    }

    const otp        = generateOtp();
    const otpExpires = new Date(Date.now() + OTP_EXPIRE);
    pending.otp        = otp;
    pending.otpExpires = otpExpires;
    pending.createdAt  = new Date();
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

    // Kiểm tra có pending OTP không (chưa xác minh)
    const pending = await PendingRegistration.findOne({ email });
    if (pending) {
      return res.status(403).json(error(
        'Tài khoản chưa được xác minh. Vui lòng nhập mã OTP đã gửi tới email của bạn.',
        { code: 'EMAIL_NOT_VERIFIED', email }
      ));
    }

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

    // Chỉ yêu cầu email verified với role user — admin/support tạo thủ công nên bỏ qua
    if (user.role === 'user' && !user.emailVerified) {
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

// ── GOOGLE LOGIN ──────────────────────────────────────────────────────────────
const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json(error('Không có token'));

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email }).select('+password');
    if (!user) {
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name,
        email,
        password: randomPassword,
        avatar: picture || '',
        emailVerified: true,
        role: 'user',
        googleId,
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      await user.save({ validateBeforeSave: false });
    }

    if (!user.isActive) {
      return res.status(403).json(error('Tài khoản đã bị vô hiệu hóa'));
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const jwtToken = generateToken(user._id);
    res.cookie('token', jwtToken, COOKIE_OPTS);

    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = user._id.toString();

    return res.json(success('Đăng nhập Google thành công', { user: userObj, token: jwtToken }));
  } catch (err) {
    console.error('[Google Login Error]', err);
    return res.status(400).json(error('Xác thực Google thất bại. Hãy kiểm tra lại Client ID.'));
  }
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

// Backward-compat
const verifyEmail        = (req, res) => res.status(410).json(error('Link xác nhận không còn được sử dụng. Vui lòng đăng ký lại.'));
const resendVerification = resendOtp;

module.exports = {
  register, login, logout, getMe, changePassword, googleLogin,
  verifyOtp, resendOtp,
  verifyEmail, resendVerification,
};
