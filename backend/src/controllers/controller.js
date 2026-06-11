const vehicles = require("../models/vehicles.models");

const listUsers = async (req, res, next) => {
  try {
    const users = await users.findByAllUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};