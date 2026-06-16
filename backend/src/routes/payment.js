const express = require('express');
const router  = express.Router();
const { createCheckoutSession } = require('../controllers/payment');
const { verifyToken } = require('../middleware/auth');

router.post('/checkout', verifyToken, createCheckoutSession);

module.exports = router;