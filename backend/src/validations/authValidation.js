const { body } = require('express-validator');

// Số điện thoại Việt Nam: 10 số, bắt đầu bằng 0, đầu số 3/5/7/8/9
const VN_PHONE_REGEX = /^0[35789][0-9]{8}$/;

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Tên không được để trống'),
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu ít nhất 6 ký tự'),
  body('phone')
    .notEmpty().withMessage('Số điện thoại không được để trống')
    .custom(val => {
      const cleaned = String(val).replace(/\s/g, '');
      if (!VN_PHONE_REGEX.test(cleaned)) {
        throw new Error('Số điện thoại Việt Nam không hợp lệ (VD: 0901234567)');
      }
      return true;
    }),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
];

module.exports = { registerValidation, loginValidation };
