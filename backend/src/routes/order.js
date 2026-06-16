const express = require('express');
const router  = express.Router();
const { createOrder, getAllOrders, getMyOrders, getOne, updateStatus } = require('../controllers/order');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.post('/',             verifyToken,              createOrder);   // Passer commande
router.get('/',              verifyToken, verifyAdmin, getAllOrders);   // Toutes (admin)
router.get('/mes-commandes', verifyToken,              getMyOrders);   // Les miennes
router.get('/:id',           verifyToken,              getOne);        // Détail
router.put('/:id/statut',    verifyToken, verifyAdmin, updateStatus);  // Changer statut (admin)

module.exports = router;