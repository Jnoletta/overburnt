const express = require('express');
const router  = express.Router();
const { getMyFavorites, addFavorite, removeFavorite } = require('../controllers/favorite');
const { verifyToken } = require('../middleware/auth');

router.get('/',                  verifyToken, getMyFavorites);
router.post('/:productId',       verifyToken, addFavorite);
router.delete('/:productId',     verifyToken, removeFavorite);

module.exports = router;