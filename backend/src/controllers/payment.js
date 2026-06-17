const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order  = require('../models/order');

const createCheckoutSession = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ message: 'order_id requis' });
    }

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ message: 'La commande ne contient aucun produit' });
    }

    // Stripe travaille en centimes
    const line_items = order.items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: { name: item.name },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));


    console.log('success_url:', `${process.env.FRONTEND_URL}/pages/succes.html?order_id=${order_id}`);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/pages/succes.html?order_id=${order_id}`,
      cancel_url:  `${process.env.FRONTEND_URL}/pages/panier.html`,
      metadata: { order_id: order_id.toString() },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Erreur checkout Stripe :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { createCheckoutSession };