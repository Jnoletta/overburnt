const Favorite = require('../models/favorite');
const Product  = require('../models/product');

const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.findByUserId(req.user.id);
    res.json(favorites);
  } catch (err) {
    console.error('Erreur getMyFavorites :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const addFavorite = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const alreadyFavorited = await Favorite.exists(req.user.id, productId);
    if (alreadyFavorited) {
      return res.status(409).json({ message: 'Produit déjà en favori' });
    }

    await Favorite.add(req.user.id, productId);
    res.status(201).json({ message: 'Ajouté aux favoris' });
  } catch (err) {
    console.error('Erreur addFavorite :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const affected = await Favorite.remove(req.user.id, productId);
    if (!affected) {
      return res.status(404).json({ message: 'Favori introuvable' });
    }

    res.json({ message: 'Retiré des favoris' });
  } catch (err) {
    console.error('Erreur removeFavorite :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getMyFavorites, addFavorite, removeFavorite };