const express = require('express');
const router  = express.Router();
const path    = require('path');
const multer  = require('multer');
const {
  getMyTickets, createTicket, getTicketMessages, sendUserMessage,
  staffGetAllTickets, staffGetMessages, staffSendMessage,
  staffUpdateStatus, staffUpdatePriority, staffAssign,
} = require('../controllers/supportController');
const { protect }     = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh')),
});

const isStaff = requireRole('admin', 'support');

// ── User routes ──────────────────────────────────────────────
router.get ('/my-tickets',           protect, getMyTickets);
router.post('/tickets',              protect, createTicket);
router.get ('/tickets/:id/messages', protect, getTicketMessages);
router.post('/tickets/:id/messages', protect, upload.single('image'), sendUserMessage);

// ── Staff / Admin routes ─────────────────────────────────────
router.get  ('/staff/tickets',              protect, isStaff, staffGetAllTickets);
router.get  ('/staff/tickets/:id/messages', protect, isStaff, staffGetMessages);
router.post ('/staff/tickets/:id/messages', protect, isStaff, upload.single('image'), staffSendMessage);
router.patch('/staff/tickets/:id/status',   protect, isStaff, staffUpdateStatus);
router.patch('/staff/tickets/:id/priority', protect, isStaff, staffUpdatePriority);
router.patch('/staff/tickets/:id/assign',   protect, isStaff, staffAssign);

// backward-compat aliases (admin dashboard still works)
router.get  ('/admin/tickets',              protect, isStaff, staffGetAllTickets);
router.get  ('/admin/tickets/:id/messages', protect, isStaff, staffGetMessages);
router.post ('/admin/tickets/:id/messages', protect, isStaff, upload.single('image'), staffSendMessage);
router.patch('/admin/tickets/:id/status',   protect, isStaff, staffUpdateStatus);

module.exports = router;
