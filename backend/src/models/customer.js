const pool = require('../config/db');

const findAll = async () => {
  const [rows] = await pool.query(
    `SELECT c.*, u.email
     FROM customers c
     JOIN users u ON c.user_id = u.id
     ORDER BY c.created_at DESC`
  );
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM customers WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const findByUserId = async (userId) => {
  const [rows] = await pool.query(
    'SELECT * FROM customers WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
};

const create = async (userId, { name, surname, street, city, postal_code, country, phone }) => {
  const [result] = await pool.query(
    `INSERT INTO customers (user_id, name, surname, street, city, postal_code, country, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [userId, name, surname, street || null, city || null, postal_code || null, country || null, phone || null]
  );
  return result.insertId;
};

const update = async (userId, { name, surname, street, city, postal_code, country, phone }) => {
  const [result] = await pool.query(
    `UPDATE customers
     SET name = ?, surname = ?, street = ?, city = ?, postal_code = ?, country = ?, phone = ?, updated_at = NOW()
     WHERE user_id = ?`,
    [name, surname, street || null, city || null, postal_code || null, country || null, phone || null, userId]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM customers WHERE id = ?',
    [id]
  );
  return result.affectedRows;
};

module.exports = { findAll, findById, findByUserId, create, update, remove };