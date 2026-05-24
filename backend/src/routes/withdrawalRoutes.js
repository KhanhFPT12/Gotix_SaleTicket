const express = require('express');
const router = express.Router();
const { createWithdrawal, getMyWithdrawals } = require('../controllers/withdrawalController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createWithdrawal);
router.get('/me', protect, getMyWithdrawals);

module.exports = router;
