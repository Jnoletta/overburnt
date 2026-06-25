const express = require('express');
const router  = express.Router();
const { getMyProfile, createMyProfile, updateMyProfile, getAllCustomers, getOne, remove } = require('../controllers/customer');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Profil utilisateur connecté
router.get('/mon-profil',  verifyToken,              getMyProfile);
router.post('/mon-profil', verifyToken,              createMyProfile);
router.put('/mon-profil',  verifyToken,              updateMyProfile);

// Admin
router.get('/',    verifyToken, verifyAdmin, getAllCustomers);
router.get('/:id', verifyToken, verifyAdmin, getOne);
router.delete('/:id', verifyToken, verifyAdmin, remove);

module.exports = router;