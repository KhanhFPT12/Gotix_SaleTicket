const express = require('express');
const router = express.Router();
const { createReview, getSellerReviews, getMyReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/seller/:sellerId', getSellerReviews);

module.exports = router;
