const express = require('express');
const router = express.Router();
const { getMyWallet, getWalletHistory } = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyWallet);
router.get('/history', protect, getWalletHistory);

module.exports = router;
