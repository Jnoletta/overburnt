const Order   = require('../models/order');
const Product = require('../models/product');

const STATUTS_VALIDES = ['en_attente', 'en_preparation', 'expediee', 'livree', 'annulee'];

// Créer une commande

const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide' });
    }

    // Récupérer le profil client lié à cet utilisateur
    const customer = await Order.findCustomerByUserId(req.user.id);
    if (!customer) {
      return res.status(400).json({
        message: 'Profil client incomplet. Veuillez renseigner vos informations.',
      });
    }

    // Snapshot de l'adresse au moment de la commande
    const shippingAddress = [
      customer.street,
      customer.city,
      customer.postal_code,
      customer.country,
    ].filter(Boolean).join(', ');

    // Récupérer les prix depuis la BDD
    const enrichedItems = [];
    let totalCost = 0;

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ message: 'Données produit invalides' });
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(404).json({ message: `Produit ${item.product_id} introuvable` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour "${product.name}"`,
        });
      }

      enrichedItems.push({
        product_id: product.id,
        quantity:   item.quantity,
        unit_price: product.price,
        taux_tva:   product.taux_tva,
      });

      totalCost += product.price * item.quantity;
    }

    const orderId = await Order.create(customer.id, enrichedItems, totalCost.toFixed(2), shippingAddress);
    const order   = await Order.findById(orderId);

    res.status(201).json({ message: 'Commande créée', order });
  } catch (err) {
    console.error('Erreur createOrder :', err);

    if (err.message && err.message.startsWith('Stock insuffisant')) {
      return res.status(409).json({ message: 'Stock insuffisant, la commande a été annulée. Veuillez réessayer.' });
    }

    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Toutes les commandes (admin)

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.json(orders);
  } catch (err) {
    console.error('Erreur getAllOrders :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mes commandes (utilisateur connecté)

const getMyOrders = async (req, res) => {
  try {
    const customer = await Order.findCustomerByUserId(req.user.id);
    if (!customer) return res.json([]);

    const orders = await Order.findByCustomerId(customer.id);
    res.json(orders);
  } catch (err) {
    console.error('Erreur getMyOrders :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Détail d'une commande

const getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }
    res.json(order);
  } catch (err) {
    console.error('Erreur getOne order :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut (admin)

const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!STATUTS_VALIDES.includes(status)) {
      return res.status(400).json({
        message: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}`,
      });
    }

    const affected = await Order.updateStatus(req.params.id, status);
    if (!affected) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }

    const order = await Order.findById(req.params.id);
    res.json({ message: 'Statut mis à jour', order });
  } catch (err) {
    console.error('Erreur updateStatus :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createOrder, getAllOrders, getMyOrders, getOne, updateStatus };