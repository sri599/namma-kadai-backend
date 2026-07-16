const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  createShop,
  getShops,
  getShopById,
  updateShop,
  deleteShop,
  toggleShopStatus,
  resumeAutoStatus,
} = require("../controllers/shop.controller");

router.post(
  "/",
  upload.single("image"),
  createShop
);

router.get(
  "/",
  getShops
);

router.get(
  "/:id",
  getShopById
);

router.put(
  "/:id",
  upload.single("image"),
  updateShop
);

router.delete(
  "/:id",
  deleteShop
);
router.patch(
  "/:id/toggle-status",
  toggleShopStatus
);

router.patch(
  "/:id/resume-auto-status",
  resumeAutoStatus
);

module.exports = router;