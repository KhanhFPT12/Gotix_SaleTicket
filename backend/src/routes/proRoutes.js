const express = require('express');
const router = express.Router();
const { getPlans, upgradePro, getMySubscription, cancelPro } = require('../controllers/proController');
const { protect } = require('../middleware/authMiddleware');

router.get('/plans', getPlans);
router.get('/my-subscription', protect, getMySubscription);
router.post('/upgrade', protect, upgradePro);
router.post('/cancel', protect, cancelPro);

module.exports = router;
