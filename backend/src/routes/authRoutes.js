const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, changePassword,
  verifyEmail, resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../validations/authValidation');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put ('/change-password',     protect, changePassword);
router.get ('/verify-email/:token', verifyEmail);
// optionalAuth so logged-in users use token, others pass email in body
router.post('/resend-verification', resendVerification);

module.exports = router;
