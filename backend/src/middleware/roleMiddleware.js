const { error } = require('../utils/apiResponse');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(error('Chưa đăng nhập'));
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(error('Không có quyền thực hiện hành động này'));
    }
    next();
  };
};

module.exports = { requireRole };
