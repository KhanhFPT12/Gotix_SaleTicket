const express = require('express');
const router  = express.Router();
const {
  createTransaction,
  confirmUserPaid,
  adminConfirmTransaction,
  adminRejectTransaction,
  cancelTransaction,
  getMyPurchases,
  getMySales,
  getTransactionById,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/',                           protect, createTransaction);
router.get('/my-purchases',               protect, getMyPurchases);
router.get('/my-sales',                   protect, getMySales);
router.get('/:id',                        protect, getTransactionById);
router.patch('/:id/user-confirmed',       protect, confirmUserPaid);
router.patch('/:id/admin-confirm',        protect, adminConfirmTransaction);
router.patch('/:id/admin-reject',         protect, adminRejectTransaction);
router.patch('/:id/cancel',               protect, cancelTransaction);

module.exports = router;
