const express = require('express');
const router = express.Router();
const { sendMessage, getConversations, getUnreadCount, getMessages, markAllRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:ticketId/:userId', protect, getMessages);
router.post('/', protect, sendMessage);
router.patch('/read/:ticketId/:userId', protect, markAllRead);

module.exports = router;
