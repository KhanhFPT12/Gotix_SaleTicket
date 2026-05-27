const express = require('express');
const router = express.Router();
const { getAdminBankInfo, createTopUp, getMyTopUps, vnpayReturnTopUp } = require('../controllers/topUpController');
const { protect } = require('../middleware/authMiddleware');

router.get('/bank-info', protect, getAdminBankInfo);
router.post('/', protect, createTopUp);
router.get('/me', protect, getMyTopUps);
router.get('/vnpay/return', vnpayReturnTopUp);

module.exports = router;
