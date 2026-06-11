const cors = require('cors');
const express = require("express");
const app = express();
const vehiclesRoutes = require("src/routes/route");


app.use(express.json());
app.use(cors());
app.use("/users", usersRoutes);



app.listen(3000, () => {
  console.log("server running on port 3000");
});