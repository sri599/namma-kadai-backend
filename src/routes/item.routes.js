const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} = require("../controllers/item.controller");

router.post(
  "/",
  upload.array("images", 10),
  createItem
);

router.get(
  "/",
  getItems
);

router.get(
  "/:id",
  getItemById
);

router.put(
  "/:id",
  upload.array("images", 10),
  updateItem
);

router.delete(
  "/:id",
  deleteItem
);

module.exports = router;