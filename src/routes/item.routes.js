const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  toggleItemAvailability,
  resumeItemAutoAvailability,
   getItemsByShop,
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
  "/by-shop/:shopId",
  getItemsByShop
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
router.patch(
  "/:id/toggle-availability",
  toggleItemAvailability
);

router.patch(
  "/:id/resume-auto-availability",
  resumeItemAutoAvailability
);
module.exports = router;