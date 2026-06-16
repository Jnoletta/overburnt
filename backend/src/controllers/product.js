const Product = require('../models/product');

const getAll = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('Erreur getAll produits :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }
    res.json(product);
  } catch (err) {
    console.error('Erreur getOne produit :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const create = async (req, res) => {
  try {
    const { name, slug, category, price, taux_tva, stock, image_url, description } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Nom, prix et stock requis' });
    }

    const id      = await Product.create({ name, slug, category, price, taux_tva, stock, image_url, description });
    const product = await Product.findById(id);

    res.status(201).json({ message: 'Produit créé', product });
  } catch (err) {
    console.error('Erreur create produit :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const update = async (req, res) => {
  try {
    const { name, slug, category, price, taux_tva, stock, is_active, image_url, description } = req.body;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Nom, prix et stock requis' });
    }

    const affected = await Product.update(req.params.id, { name, slug, category, price, taux_tva, stock, is_active, image_url, description });
    if (!affected) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }

    const product = await Product.findById(req.params.id);
    res.json({ message: 'Produit mis à jour', product });
  } catch (err) {
    console.error('Erreur update produit :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const remove = async (req, res) => {
  try {
    const affected = await Product.remove(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Produit introuvable' });
    }
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    console.error('Erreur remove produit :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { getAll, getOne, create, update, remove };