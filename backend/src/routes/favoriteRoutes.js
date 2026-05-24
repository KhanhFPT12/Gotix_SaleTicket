const express = require('express');
const router = express.Router();
const { toggleFavorite, getMyFavorites, checkFavorite } = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/me',               getMyFavorites);
router.get('/check/:ticketId',  checkFavorite);
router.post('/:ticketId',       toggleFavorite);
router.delete('/:ticketId',     toggleFavorite);

module.exports = router;
