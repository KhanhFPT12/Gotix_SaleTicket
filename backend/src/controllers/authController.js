const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
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
    // Force role to 'user' — clients cannot self-assign admin
    const user = await User.create({ name, email, password, phone, role: 'user' });
    const token = generateToken(user._id);
    res.cookie('token', token, COOKIE_OPTS);
    return res.status(201).json(success('Đăng ký thành công', { user, token }));
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
      return res.status(403).json(error('Tài khoản đã bị khóa'));
    }
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

module.exports = { register, login, logout, getMe, changePassword };
