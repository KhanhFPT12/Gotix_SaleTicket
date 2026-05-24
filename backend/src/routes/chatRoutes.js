const express = require('express');
const router = express.Router();
const { sendMessage, getConversations, getMessagesWith, markAsRead } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getMessagesWith);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;
