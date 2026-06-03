const express = require('express');
const router  = express.Router();
const {
  register, login, logout, getMe, changePassword,
  verifyOtp, resendOtp, verifyEmail, resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerValidation, loginValidation } = require('../validations/authValidation');

router.post('/register',             registerValidation, register);
router.post('/login',                loginValidation,    login);
router.post('/logout',               logout);
router.get ('/me',                   protect, getMe);
router.put ('/change-password',      protect, changePassword);

// OTP flow
router.post('/verify-otp',           verifyOtp);
router.post('/resend-otp',           resendOtp);

// Backward compat (deprecated)
router.get ('/verify-email/:token',  verifyEmail);
router.post('/resend-verification',  resendVerification);

module.exports = router;
