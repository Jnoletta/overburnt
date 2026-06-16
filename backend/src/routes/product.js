const express  = require('express');
const router   = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/product');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// ── Publiques ─────────────────────────────────────────────────────────────────
router.get('/',    getAll);
router.get('/:id', getOne);

// ── Admin uniquement ──────────────────────────────────────────────────────────
router.post('/',       verifyToken, verifyAdmin, create);
router.put('/:id',     verifyToken, verifyAdmin, update);
router.delete('/:id',  verifyToken, verifyAdmin, remove);

module.exports = router;