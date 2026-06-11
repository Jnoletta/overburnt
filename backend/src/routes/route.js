const router = require("express").Router();
const usersController = require("../controllers/controller");

router.get("/", usersController.listVehicles);

router.post("/", usersController.createVehicle)

module.exports = router;
