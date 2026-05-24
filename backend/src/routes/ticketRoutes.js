const express = require('express');
const router = express.Router();
const {
  getTickets, getTicketById, getMyPosted,
  createTicket, updateTicket, deleteTicket,
  updateTicketStatus, verifyTicket,
} = require('../controllers/ticketController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const { createTicketValidation } = require('../validations/ticketValidation');
const upload = require('../middleware/uploadMiddleware');

const ticketImages = upload.fields([
  { name: 'ticketImage', maxCount: 1 },
  { name: 'qrImage',     maxCount: 1 },
]);

router.get('/',           optionalAuth, getTickets);
router.get('/my-posted',  protect,      getMyPosted);
router.get('/:id',        getTicketById);

// Any logged-in user can post a ticket — no seller role required
router.post('/',          protect, ticketImages, createTicketValidation, createTicket);
router.put('/:id',        protect, ticketImages, updateTicket);
router.delete('/:id',     protect, deleteTicket);
router.patch('/:id/status',  protect, updateTicketStatus);
router.patch('/:id/verify',  protect, requireRole('admin'), verifyTicket);

module.exports = router;
