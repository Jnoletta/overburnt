const pool = require("../config/db");

const findByAllUsers = async () => {
  const [list] = await pool.query("SELECT * FROM users");

  return list;
};

// const findByAllCars = async () => {
//   const [list] = await pool.query("SELECT * FROM cars");

//   return list;
// };

// const createVehicle = async ({name, brand, category, type, rarity, price, max_speed }) => {
//     const [result] = await pool.query(
//         "INSERT INTO vehicles (name, brand, category, type, rarity, price, max_speed ) VALUES (?,?,?,?,?,?,?)",
//         [name, brand, category, type, rarity, price, max_speed]
//     );
//     return result.insertId;
// }

module.exports = { findByAllUsers };
