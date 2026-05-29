const express = require('express');
const router  = express.Router();
const {
  getPlans, upgradePro, confirmUserPaidPro,
  adminConfirmPro, adminRejectPro,
  getMySubscription, cancelPro,
  getAdminProSubscriptions,
} = require('../controllers/proController');
const { protect }      = require('../middleware/authMiddleware');
const { requireRole }  = require('../middleware/roleMiddleware');

router.get('/plans',                    getPlans);
router.get('/my-subscription',          protect, getMySubscription);
router.post('/upgrade',                 protect, upgradePro);
router.patch('/:id/user-confirmed',     protect, confirmUserPaidPro);
router.post('/cancel',                  protect, cancelPro);

// Admin-only
router.get('/admin/list',               protect, requireRole('admin'), getAdminProSubscriptions);
router.patch('/:id/admin-confirm',      protect, requireRole('admin'), adminConfirmPro);
router.patch('/:id/admin-reject',       protect, requireRole('admin'), adminRejectPro);

module.exports = router;
