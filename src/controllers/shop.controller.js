const Shop = require("../models/Shop");

const {
  uploadImage,
  deleteImage,
} = require("../services/cloudinary.service");


// Create Shop
exports.createShop = async (req, res) => {
  try {

    let image = {
      url: "",
      public_id: "",
    };

    if (req.file) {
      const uploaded = await uploadImage(
        req.file.buffer,
        "shops"
      );

      image = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const shop = await Shop.create({
      name: {
        en: req.body.name_en,
        ta: req.body.name_ta,
      },

      description: {
        en: req.body.description_en || "",
        ta: req.body.description_ta || "",
      },

      image,

      phone: req.body.phone,

      email: req.body.email || "",

      address: {
        doorNo: req.body.doorNo || "",
        street: req.body.street || "",
        area: req.body.area || "",
        city: req.body.city || "",
        district: req.body.district || "",
        state: req.body.state || "",
        pincode: req.body.pincode || "",
      },

      latitude: Number(req.body.latitude || 0),

      longitude: Number(req.body.longitude || 0),

      location: {
        type: "Point",
        coordinates: [
          Number(req.body.longitude || 0),
          Number(req.body.latitude || 0),
        ],
      },

      openingTime: req.body.openingTime || "",

      closingTime: req.body.closingTime || "",

      deliveryRadius: req.body.deliveryRadius || 5,

      displayOrder: req.body.displayOrder || 0,

      isOpen: Shop.computeIsOpen(
        req.body.openingTime,
        req.body.closingTime
      ),

      isManualOverride: false,

      isActive:
        req.body.isActive === "false"
          ? false
          : true,
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      data: shop,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// Get All Shops
exports.getShops = async (req, res) => {

  try {

    const shops = await Shop.find()
      .sort({
        displayOrder: 1,
      });

    const data = shops.map((shop) => {
      const obj = shop.toObject();
      obj.isOpen = shop.getCurrentStatus();
      return obj;
    });

    res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



// Get Shop By Id
exports.getShopById = async (req, res) => {

  try {

    const shop =
      await Shop.findById(req.params.id);

    if (!shop) {

      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });

    }

    const shopObj = shop.toObject();
    shopObj.isOpen = shop.getCurrentStatus();

    res.json({
      success: true,
      data: shopObj,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



// Update Shop
exports.updateShop = async (req, res) => {

  try {

    const shop =
      await Shop.findById(req.params.id);

    if (!shop) {

      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });

    }

    if (req.file) {

      await deleteImage(
        shop.image.public_id
      );

      const uploaded =
        await uploadImage(
          req.file.buffer,
          "shops"
        );

      shop.image = {
        url: uploaded.secure_url,
        public_id:
          uploaded.public_id,
      };
    }

    if (req.body.name_en)
      shop.name.en =
        req.body.name_en;

    if (req.body.name_ta)
      shop.name.ta =
        req.body.name_ta;

    if (
      req.body.description_en !==
      undefined
    )
      shop.description.en =
        req.body.description_en;

    if (
      req.body.description_ta !==
      undefined
    )
      shop.description.ta =
        req.body.description_ta;

    if (req.body.phone)
      shop.phone = req.body.phone;

    if (req.body.email !== undefined)
      shop.email = req.body.email;

    shop.address.doorNo =
      req.body.doorNo ??
      shop.address.doorNo;

    shop.address.street =
      req.body.street ??
      shop.address.street;

    shop.address.area =
      req.body.area ??
      shop.address.area;

    shop.address.city =
      req.body.city ??
      shop.address.city;

    shop.address.district =
      req.body.district ??
      shop.address.district;

    shop.address.state =
      req.body.state ??
      shop.address.state;

    shop.address.pincode =
      req.body.pincode ??
      shop.address.pincode;

    if (
      req.body.latitude &&
      req.body.longitude
    ) {

      shop.latitude = Number(req.body.latitude);
      shop.longitude = Number(req.body.longitude);

      shop.location.coordinates = [
        Number(req.body.longitude),
        Number(req.body.latitude),
      ];

    }

    if (
      req.body.openingTime !==
      undefined
    )
      shop.openingTime =
        req.body.openingTime;

    if (
      req.body.closingTime !==
      undefined
    )
      shop.closingTime =
        req.body.closingTime;

    if (
      req.body.deliveryRadius !==
      undefined
    )
      shop.deliveryRadius =
        req.body.deliveryRadius;

    if (
      req.body.displayOrder !==
      undefined
    )
      shop.displayOrder =
        req.body.displayOrder;

   // openingTime/closingTime changed and not manually overridden -> recompute
    if (
      !shop.isManualOverride &&
      (req.body.openingTime !== undefined ||
        req.body.closingTime !== undefined)
    ) {
      shop.isOpen = Shop.computeIsOpen(
        shop.openingTime,
        shop.closingTime
      );
    }

    if (
      req.body.isActive !==
      undefined
    )
      shop.isActive =
        req.body.isActive == "true";

    await shop.save();

    res.json({
      success: true,
      message: "Shop updated successfully",
      data: shop,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



// Delete Shop
exports.deleteShop = async (req, res) => {

  try {

    const shop =
      await Shop.findById(req.params.id);

    if (!shop) {

      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });

    }

    await deleteImage(
      shop.image.public_id
    );

    await shop.deleteOne();

    res.json({
      success: true,
      message: "Shop deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};
// Toggle Shop Open/Close (manual override)
exports.toggleShopStatus = async (req, res) => {
  try {

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    shop.isManualOverride = true;

    shop.isOpen =
      req.body.isOpen !== undefined
        ? req.body.isOpen == "true" || req.body.isOpen === true
        : !shop.isOpen;

    await shop.save();

    res.json({
      success: true,
      message: "Shop status updated successfully",
      data: shop,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// Resume Automatic (opening/closing time based) Status
exports.resumeAutoStatus = async (req, res) => {
  try {

    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    shop.isManualOverride = false;
    shop.isOpen = shop.getCurrentStatus();

    await shop.save();

    res.json({
      success: true,
      message: "Shop resumed automatic status",
      data: shop,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};