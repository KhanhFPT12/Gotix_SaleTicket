const { error } = require('../utils/apiResponse');

const notFound = (req, res, next) => {
  const err = new Error(`Route không tồn tại: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi server';

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} đã tồn tại`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID không hợp lệ';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  return res.status(statusCode).json(error(message));
};

module.exports = { notFound, errorHandler };
