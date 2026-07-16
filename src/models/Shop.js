const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
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

    image: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    address: {
      doorNo: {
        type: String,
        default: "",
      },

      street: {
        type: String,
        default: "",
      },

      area: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      district: {
        type: String,
        default: "",
      },

      state: {
        type: String,
        default: "",
      },

      pincode: {
        type: String,
        default: "",
      },
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    latitude: {
      type: Number,
      default: 0,
    },

    longitude: {
      type: Number,
      default: 0,
    },

    openingTime: {
      type: String,
      default: "",
    },

    closingTime: {
      type: String,
      default: "",
    },

    deliveryRadius: {
      type: Number,
      default: 5,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    isOpen: {
      type: Boolean,
      default: true,
    },

    // true once owner manually toggles status — auto time-window logic is skipped until resumed
    isManualOverride: {
      type: Boolean,
      default: false,
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

shopSchema.index({
  location: "2dsphere",
});

// openingTime/closingTime must be 24hr "HH:mm" strings, e.g. "09:00", "22:30"
shopSchema.statics.computeIsOpen = function (openingTime, closingTime) {
  if (!openingTime || !closingTime) return true;

  const now = new Date();
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (closeMinutes > openMinutes) {
    // same-day window, e.g. 09:00 - 22:00
    return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
  }

  // overnight window, e.g. 20:00 - 02:00
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes;
};

shopSchema.methods.getCurrentStatus = function () {
  if (this.isManualOverride) return this.isOpen;
  return this.constructor.computeIsOpen(this.openingTime, this.closingTime);
};

shopSchema.pre("save", function () {
  if (this.latitude || this.longitude) {
    this.location.coordinates = [this.longitude || 0, this.latitude || 0];
  }
});

module.exports = mongoose.model("Shop", shopSchema);