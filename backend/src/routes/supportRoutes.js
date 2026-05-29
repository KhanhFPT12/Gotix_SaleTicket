const express = require('express');
const router  = express.Router();
const path    = require('path');
const multer  = require('multer');
const {
  getMyTickets, createTicket, getTicketMessages, sendUserMessage,
  adminGetAllTickets, adminGetMessages, adminSendMessage, adminUpdateStatus,
} = require('../controllers/supportController');
const { protect }     = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh')),
});

// User routes
router.get ('/my-tickets',              protect, getMyTickets);
router.post('/tickets',                 protect, createTicket);
router.get ('/tickets/:id/messages',    protect, getTicketMessages);
router.post('/tickets/:id/messages',    protect, upload.single('image'), sendUserMessage);

// Admin routes
router.get ('/admin/tickets',              protect, requireRole('admin'), adminGetAllTickets);
router.get ('/admin/tickets/:id/messages', protect, requireRole('admin'), adminGetMessages);
router.post('/admin/tickets/:id/messages', protect, requireRole('admin'), upload.single('image'), adminSendMessage);
router.patch('/admin/tickets/:id/status', protect, requireRole('admin'), adminUpdateStatus);

module.exports = router;
