const pool = require('../config/db');

const findByUserId = async (userId) => {
  const [rows] = await pool.query(
    `SELECT f.id, f.created_at, p.*
     FROM favorites f
     JOIN products p ON f.product_id = p.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
};

const exists = async (userId, productId) => {
  const [rows] = await pool.query(
    'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return !!rows[0];
};

const add = async (userId, productId) => {
  const [result] = await pool.query(
    'INSERT INTO favorites (user_id, product_id, created_at) VALUES (?, ?, NOW())',
    [userId, productId]
  );
  return result.insertId;
};

const remove = async (userId, productId) => {
  const [result] = await pool.query(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return result.affectedRows;
};

module.exports = { findByUserId, exists, add, remove };