const success = (message, data = null) => ({
  success: true,
  message,
  data,
});

const error = (message, errors = null) => ({
  success: false,
  message,
  ...(errors && { errors }),
});

module.exports = { success, error };
