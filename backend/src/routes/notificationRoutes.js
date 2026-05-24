const express = require('express');
const router = express.Router();
const { getMyNotifications, markRead, markAllRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/',              getMyNotifications);
router.patch('/read-all',    markAllRead);
router.patch('/:id/read',    markRead);
router.delete('/:id',        deleteNotification);

module.exports = router;
