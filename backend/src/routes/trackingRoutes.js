const express = require('express');
const router = express.Router();
const { pingTracking, getStats } = require('../controllers/trackingController');

// Any user or guest can hit this endpoint
router.post('/ping', pingTracking);

// Admin or dashboard polling endpoint
router.get('/stats', getStats);

module.exports = router;
