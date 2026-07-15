const express = require("express");
const cors = require("cors");

const categoryRoutes = require("./routes/category.routes");

const app = express();
const shopRoutes = require("./routes/shop.routes");
const itemRoutes = require("./routes/item.routes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Namma Kadai Backend Running",
  });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/items", itemRoutes);
module.exports = app;