const express = require('express');
const router = express.Router();
const { getAdminBankInfo, createTopUp, getMyTopUps } = require('../controllers/topUpController');
const { protect } = require('../middleware/authMiddleware');

router.get('/bank-info', protect, getAdminBankInfo);
router.post('/', protect, createTopUp);
router.get('/me', protect, getMyTopUps);

module.exports = router;
