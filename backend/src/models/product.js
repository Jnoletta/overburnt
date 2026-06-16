const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC'
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM products WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async ({ name, slug, category, price, taux_tva, stock, image_url, description }) => {
  const [result] = await pool.query(
    `INSERT INTO products (name, slug, category, price, taux_tva, stock, is_active, image_url, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, NOW(), NOW())`,
    [name, slug || null, category || null, price, taux_tva || 20.00, stock, image_url || null, description || null]
  );
  return result.insertId;
};

const update = async (id, { name, slug, category, price, taux_tva, stock, is_active, image_url, description }) => {
  const [result] = await pool.query(
    `UPDATE products
     SET name = ?, slug = ?, category = ?, price = ?, taux_tva = ?, stock = ?, is_active = ?, image_url = ?, description = ?, updated_at = NOW()
     WHERE id = ?`,
    [name, slug || null, category || null, price, taux_tva ?? 20.00, stock, is_active ?? 1, image_url || null, description || null, id]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM products WHERE id = ?',
    [id]
  );
  return result.affectedRows;
};

module.exports = { findAll, findById, create, update, remove };