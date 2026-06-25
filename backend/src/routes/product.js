const express  = require('express');
const router   = express.Router();
const { getAll, getOne, create, update, remove, getAllAdmin } = require('../controllers/product');
const { verifyToken, verifyAdmin } = require('../middleware/auth');


// Routes Publiques
router.get('/',    getAll);
router.get('/:id', getOne);

// Routes Admin
router.post('/',       verifyToken, verifyAdmin, create);
router.put('/:id',     verifyToken, verifyAdmin, update);
router.delete('/:id',  verifyToken, verifyAdmin, remove);
router.get('/admin/all', verifyToken, verifyAdmin, getAllAdmin);

module.exports = router;