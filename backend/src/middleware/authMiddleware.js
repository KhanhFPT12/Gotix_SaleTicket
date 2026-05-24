const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json(error('Chưa đăng nhập'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json(error('Token không hợp lệ hoặc tài khoản bị khóa'));
    }
    req.user = { id: user._id.toString(), role: user.role, email: user.email };
    next();
  } catch {
    return res.status(401).json(error('Token không hợp lệ'));
  }
};

// Attach user if token present, but don't block unauthenticated requests
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = { id: user._id.toString(), role: user.role, email: user.email };
      }
    }
  } catch {
    // Continue without auth
  }
  next();
};

module.exports = { protect, optionalAuth };
