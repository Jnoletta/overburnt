const pool = require('../config/db');

const findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    'SELECT id, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

const create = async (email, hashedPassword) => {
  const [result] = await pool.query(
    'INSERT INTO users (email, password, role, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [email, hashedPassword, 'customer']
  );
  return result.insertId;
};

const findAll = async () => {
  const [rows] = await pool.query(
    'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
};

const updatePassword = async (id, hashedPassword) => {
  const [result] = await pool.query(
    'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
    [hashedPassword, id]
  );
  return result.affectedRows;
};

const updateRole = async (id, role) => {
  const [result] = await pool.query(
    'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
    [role, id]
  );
  return result.affectedRows;
};

const remove = async (id) => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    // 1. Supprimer les lignes de commande liées aux commandes du customer
    await conn.query(
      `DELETE op FROM order_products op
       INNER JOIN orders o ON op.order_id = o.id
       INNER JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?`,
      [id]
    );

    // 2. Supprimer les commandes du customer
    await conn.query(
      `DELETE o FROM orders o
       INNER JOIN customers c ON o.customer_id = c.id
       WHERE c.user_id = ?`,
      [id]
    );

    // 3. Supprimer le profil customer
    await conn.query('DELETE FROM customers WHERE user_id = ?', [id]);

    // 4. Supprimer l'utilisateur (favorites supprimés automatiquement via CASCADE)
    const [result] = await conn.query('DELETE FROM users WHERE id = ?', [id]);

    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findByEmail, findById, create, findAll, updatePassword, updateRole, remove };