const pool = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────

const findCustomerByUserId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM customers WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
};

// ── Lecture ───────────────────────────────────────────────────────────────────

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT o.*, c.name, c.surname
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     ORDER BY o.created_at DESC`
  );
  return rows;
};

const findByCustomerId = async (customerId) => {
  const [rows] = await pool.query(
    'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );
  return rows;
};

const findById = async (id) => {
  const [orderRows] = await pool.query(
    'SELECT * FROM orders WHERE id = ?',
    [id]
  );
  if (!orderRows[0]) return null;

  const [itemRows] = await pool.query(
    `SELECT op.*, p.name
     FROM order_products op
     JOIN products p ON op.product_id = p.id
     WHERE op.order_id = ?`,
    [id]
  );

  return { ...orderRows[0], items: itemRows };
};

// ── Écriture (transaction) ────────────────────────────────────────────────────

const create = async (customerId, items, totalCost, shippingAddress) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Créer la commande
    const [orderResult] = await conn.query(
      `INSERT INTO orders (customer_id, status, total_cost, shipping_address, created_at, updated_at)
       VALUES (?, 'en_attente', ?, ?, NOW(), NOW())`,
      [customerId, totalCost, shippingAddress || null]
    );
    const orderId = orderResult.insertId;

    // 2. Insérer chaque ligne de commande et décrémenter le stock
    for (const item of items) {
      await conn.query(
        `INSERT INTO order_products (order_id, product_id, quantity, unit_price, taux_tva, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.taux_tva]
      );

      // La condition "AND stock >= quantity" protège contre la survente
      // en cas de commandes concurrentes sur le même produit
      const [stockResult] = await conn.query(
        `UPDATE products SET stock = stock - ?, updated_at = NOW()
         WHERE id = ? AND stock >= ?`,
        [item.quantity, item.product_id, item.quantity]
      );

      if (stockResult.affectedRows === 0) {
        throw new Error(`Stock insuffisant pour le produit ${item.product_id}`);
      }
    }

    await conn.commit();
    return orderId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateStatus = async (id, newStatus) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const [currentRows] = await conn.query('SELECT status FROM orders WHERE id = ?', [id]);
    if (!currentRows[0]) {
      await conn.rollback();
      return 0;
    }
    const previousStatus = currentRows[0].status;

    const [result] = await conn.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    // Si la commande est annulée (et ne l'était pas déjà), on restitue le stock
    if (newStatus === 'annulee' && previousStatus !== 'annulee') {
      const [items] = await conn.query(
        'SELECT product_id, quantity FROM order_products WHERE order_id = ?',
        [id]
      );
      for (const item of items) {
        await conn.query(
          'UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  findCustomerByUserId,
  findAll,
  findByCustomerId,
  findById,
  create,
  updateStatus,
};