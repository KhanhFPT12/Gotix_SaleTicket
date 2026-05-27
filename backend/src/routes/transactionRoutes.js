const express = require('express');
const router = express.Router();
const {
  createTransaction, payTransaction, completeTransaction,
  cancelTransaction, getMyPurchases, getMySales, getTransactionById,
  createVnPayUrl, vnpayReturn
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTransaction);
router.get('/my-purchases', protect, getMyPurchases);
router.get('/my-sales', protect, getMySales);
router.get('/:id', protect, getTransactionById);
router.patch('/:id/payment', protect, payTransaction);
router.patch('/:id/complete', protect, completeTransaction);
router.patch('/:id/cancel', protect, cancelTransaction);
router.post('/:id/vnpay/create-url', protect, createVnPayUrl);
router.get('/vnpay/return', vnpayReturn); // No protect here, since the redirect comes from VNPay

module.exports = router;
