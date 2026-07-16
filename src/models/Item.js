const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
    },
    public_id: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    name: {
      en: {
        type: String,
        required: true,
        trim: true,
      },
      ta: {
        type: String,
        required: true,
        trim: true,
      },
    },

    description: {
      en: {
        type: String,
        default: "",
      },
      ta: {
        type: String,
        default: "",
      },
    },

    images: [imageSchema],

   actualPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    qty: {
      type: Number,
      default: 1,
      min: 0,
    },

    unit: {
      type: String,
      default: "pcs",
    },

    stock: {
      type: Number,
      default: 0,
    },

    isVeg: {
      type: Boolean,
      default: true,
    },

   // Manually-set availability value (used when isManualOverride is true)
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // true once someone manually toggles availability — auto time-window logic is skipped until resumed
    isManualOverride: {
      type: Boolean,
      default: false,
    },

    // Optional per-item hours; if left blank, falls back to the parent shop's openingTime/closingTime.
    openingTime: {
      type: String,
      default: "",
    },

    closingTime: {
      type: String,
      default: "",
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const IST_OFFSET_MINUTES = 5 * 60 + 30;

// openingTime/closingTime must be 24hr "HH:mm" strings, e.g. "09:00", "22:30"
itemSchema.statics.computeIsAvailable = function (openingTime, closingTime) {
  if (!openingTime || !closingTime) return true;

  const now = new Date();
  const nowUtcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const nowMinutes = (nowUtcMinutes + IST_OFFSET_MINUTES) % (24 * 60);

  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
};

// shopOpeningTime/shopClosingTime are used only when this item has no hours of its own set.
itemSchema.methods.getCurrentAvailability = function (shopOpeningTime, shopClosingTime) {
  if (this.isManualOverride) return this.isAvailable;

  const openingTime = this.openingTime || shopOpeningTime;
  const closingTime = this.closingTime || shopClosingTime;

  return this.constructor.computeIsAvailable(openingTime, closingTime);
};

module.exports = mongoose.model("Item", itemSchema);