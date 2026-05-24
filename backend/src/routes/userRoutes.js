const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getSellerProfile, getUserReviews, getPublicProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.get('/seller/:id', getSellerProfile);
router.get('/public/:id', getPublicProfile);
router.get('/:id/reviews', getUserReviews);

module.exports = router;
