const express = require('express');
const router = express.Router();
const { createReport, getMyReports, getReportDetail, resolveReport, rejectReport, requestEvidence } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.post('/',           protect, createReport);
router.get('/me',          protect, getMyReports);
router.get('/my-reports',  protect, getMyReports);

// Admin
router.get('/:id',                    protect, requireRole('admin'), getReportDetail);
router.patch('/:id/resolve',          protect, requireRole('admin'), resolveReport);
router.patch('/:id/reject',           protect, requireRole('admin'), rejectReport);
router.patch('/:id/request-evidence', protect, requireRole('admin'), requestEvidence);

module.exports = router;
