const express = require('express');
const router  = express.Router();
const upload  = require('../config/multer');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.post(
  '/produit',
  verifyToken,
  verifyAdmin,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier reçu' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.status(201).json({ message: 'Image uploadée', image_url: imageUrl });
  }
);

// Gestion des erreurs Multer (taille, format)
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Fichier trop lourd. Maximum 5 Mo.' });
  }
  res.status(400).json({ message: err.message });
});

module.exports = router;