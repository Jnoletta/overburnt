const express = require('express');
const router  = express.Router();
const { getMyAccount, updatePassword, getAllUsers, remove, updateRole } = require('../controllers/user');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// ── Mon compte ────────────────────────────────────────────────────────────────
router.get('/mon-compte',                   verifyToken,              getMyAccount);
router.put('/mon-compte/mot-de-passe',      verifyToken,              updatePassword);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get('/',         verifyToken, verifyAdmin, getAllUsers);
router.put('/:id/role', verifyToken, verifyAdmin, updateRole);
router.delete('/:id',   verifyToken, verifyAdmin, remove);

module.exports = router;