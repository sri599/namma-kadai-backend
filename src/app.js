const express = require("express");
const cors = require("cors");

const categoryRoutes = require("./routes/category.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Namma Kadai Backend Running",
  });
});

app.use("/api/categories", categoryRoutes);

module.exports = app;