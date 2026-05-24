const { body } = require('express-validator');

const createTicketValidation = [
  body('title').trim().notEmpty().withMessage('Tiêu đề không được để trống'),
  body('category')
    .isIn(['movie', 'concert', 'event', 'sport', 'workshop', 'bus', 'train'])
    .withMessage('Loại vé không hợp lệ'),
  body('location').trim().notEmpty().withMessage('Địa điểm không được để trống'),
  body('originalPrice').isNumeric({ min: 0 }).withMessage('Giá gốc không hợp lệ'),
  body('resalePrice').isNumeric({ min: 0 }).withMessage('Giá pass không hợp lệ'),
  body('quantity').isInt({ min: 1 }).withMessage('Số lượng phải lớn hơn 0'),
];

module.exports = { createTicketValidation };
