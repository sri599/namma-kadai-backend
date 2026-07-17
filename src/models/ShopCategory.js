const mongoose = require("mongoose");

const shopCategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true, trim: true },
      ta: { type: String, required: true, trim: true },
    },
    description: {
      en: { type: String, default: "" },
      ta: { type: String, default: "" },
    },
    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopCategory", shopCategorySchema);