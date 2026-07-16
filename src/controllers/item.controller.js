const Item = require("../models/Item");
const Shop = require("../models/Shop");
const Category = require("../models/Category");
// actualPrice is required. sellingPrice and discountPrice are derived from each other
// if only one is sent — send either sellingPrice OR discountPrice, not both, unless you
// want to set them explicitly.
function computePricing(body) {
  const actualPrice = Number(body.actualPrice);

  if (Number.isNaN(actualPrice) || actualPrice < 0) {
    throw new Error("actualPrice must be a valid non-negative number");
  }

  let sellingPrice =
    body.sellingPrice !== undefined ? Number(body.sellingPrice) : undefined;

  let discountPrice =
    body.discountPrice !== undefined ? Number(body.discountPrice) : undefined;

  if (sellingPrice !== undefined && Number.isNaN(sellingPrice)) {
    throw new Error("sellingPrice must be a valid number");
  }
  if (discountPrice !== undefined && Number.isNaN(discountPrice)) {
    throw new Error("discountPrice must be a valid number");
  }

  if (sellingPrice === undefined && discountPrice !== undefined) {
    // discountPrice given -> derive sellingPrice, but never let it exceed actualPrice
    // or drop below 0.
    discountPrice = Math.min(Math.max(discountPrice, 0), actualPrice);
    sellingPrice = actualPrice - discountPrice;
  } else if (discountPrice === undefined && sellingPrice !== undefined) {
    // sellingPrice given -> derive discountPrice, clamping sellingPrice into
    // [0, actualPrice] so discountPrice never goes negative (which happens
    // when someone sends a sellingPrice higher than actualPrice) or exceeds
    // actualPrice.
    sellingPrice = Math.min(Math.max(sellingPrice, 0), actualPrice);
    discountPrice = actualPrice - sellingPrice;
  } else if (sellingPrice === undefined && discountPrice === undefined) {
    sellingPrice = actualPrice;
    discountPrice = 0;
  } else {
    // both provided explicitly — still clamp so they can never violate the
    // schema's min:0 constraint or disagree with actualPrice.
    sellingPrice = Math.min(Math.max(sellingPrice, 0), actualPrice);
    discountPrice = Math.min(Math.max(discountPrice, 0), actualPrice);
  }

  return { actualPrice, sellingPrice, discountPrice };
}

const {
  uploadImage,
  deleteImage,
} = require("../services/cloudinary.service");



// CREATE ITEM
exports.createItem = async (req, res) => {
  try {

    const shop = await Shop.findById(req.body.shop);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    const category = await Category.findById(
      req.body.category
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const images = [];

    if (req.files && req.files.length > 0) {

      for (const file of req.files) {

        const uploaded =
          await uploadImage(
            file.buffer,
            "items"
          );

        images.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });

      }

    }

    let pricing;
    try {
      pricing = computePricing(req.body);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const item = await Item.create({

      shop: req.body.shop,

      category: req.body.category,

      name: {
        en: req.body.name_en,
        ta: req.body.name_ta,
      },

      description: {
        en: req.body.description_en || "",
        ta: req.body.description_ta || "",
      },

      images,

      ...pricing,

      qty:
        Number(req.body.qty || 1),

      unit:
        req.body.unit || "pcs",

      stock:
        Number(req.body.stock || 0),

      isVeg:
        req.body.isVeg == "true",

      isAvailable:
        req.body.isAvailable == "true",

      isManualOverride: false,

      openingTime: req.body.openingTime || "",

      closingTime: req.body.closingTime || "",

      displayOrder:
        Number(req.body.displayOrder || 0),

      isActive:
        req.body.isActive == "true",

    });

    res.status(201).json({

      success: true,

      message:
        "Item created successfully",

      data: item,

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// GET ALL ITEMS
exports.getItems = async (req, res) => {

  try {

    const filter = {};

    if (req.query.shop)
      filter.shop = req.query.shop;

    if (req.query.category)
      filter.category = req.query.category;

    if (req.query.isAvailable)
      filter.isAvailable =
        req.query.isAvailable == "true";

    if (req.query.isActive)
      filter.isActive =
        req.query.isActive == "true";

const items =
      await Item.find(filter)

        .populate(
          "shop",
          "name phone image openingTime closingTime"
        )

        .populate(
          "category",
          "name image"
        )

        .sort({
          displayOrder: 1,
        });

    const data = items.map((item) => {
      const obj = item.toObject();
      obj.isAvailable = item.getCurrentAvailability(
        item.shop?.openingTime,
        item.shop?.closingTime
      );
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




// GET ITEM BY ID
exports.getItemById = async (
  req,
  res
) => {

  try {

   const item =
      await Item.findById(
        req.params.id
      )

        .populate(
          "shop"
        )

        .populate(
          "category"
        );

    if (!item) {

      return res.status(404).json({

        success: false,

        message:
          "Item not found",

      });

    }

    const itemObj = item.toObject();
    itemObj.isAvailable = item.getCurrentAvailability(
      item.shop?.openingTime,
      item.shop?.closingTime
    );

    res.json({

      success: true,

      data: itemObj,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
// UPDATE ITEM
exports.updateItem = async (req, res) => {
  try {

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    if (req.body.shop) {
      const shop = await Shop.findById(req.body.shop);
      if (!shop) {
        return res.status(404).json({
          success: false,
          message: "Shop not found",
        });
      }
      item.shop = req.body.shop;
    }

    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      item.category = req.body.category;
    }

    // New images are appended; pass removeImageIds (comma-separated public_ids)
    // to delete specific existing images.
    if (req.body.removeImageIds) {
      const idsToRemove = req.body.removeImageIds.split(",");

      for (const publicId of idsToRemove) {
        await deleteImage(publicId);
      }

      item.images = item.images.filter(
        (img) => !idsToRemove.includes(img.public_id)
      );
    }

    if (req.files && req.files.length > 0) {

      for (const file of req.files) {

        const uploaded = await uploadImage(
          file.buffer,
          "items"
        );

        item.images.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });

      }

    }

    if (req.body.name_en)
      item.name.en = req.body.name_en;

    if (req.body.name_ta)
      item.name.ta = req.body.name_ta;

    if (req.body.description_en !== undefined)
      item.description.en = req.body.description_en;

    if (req.body.description_ta !== undefined)
      item.description.ta = req.body.description_ta;

    if (
      req.body.actualPrice !== undefined ||
      req.body.sellingPrice !== undefined ||
      req.body.discountPrice !== undefined
    ) {
      let pricing;
      try {
        pricing = computePricing({
          actualPrice: req.body.actualPrice ?? item.actualPrice,
          sellingPrice: req.body.sellingPrice,
          discountPrice: req.body.discountPrice,
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }
      item.actualPrice = pricing.actualPrice;
      item.sellingPrice = pricing.sellingPrice;
      item.discountPrice = pricing.discountPrice;
    }

    if (req.body.qty !== undefined)
      item.qty = Number(req.body.qty);

    if (req.body.unit !== undefined)
      item.unit = req.body.unit;

    if (req.body.stock !== undefined)
      item.stock = Number(req.body.stock);

    if (req.body.isVeg !== undefined)
      item.isVeg = req.body.isVeg == "true";

    if (req.body.openingTime !== undefined)
      item.openingTime = req.body.openingTime;

    if (req.body.closingTime !== undefined)
      item.closingTime = req.body.closingTime;

    if (req.body.displayOrder !== undefined)
      item.displayOrder = Number(req.body.displayOrder);

    if (req.body.isActive !== undefined)
      item.isActive = req.body.isActive == "true";

    await item.save();

    res.json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Toggle Item Availability (manual override)
exports.toggleItemAvailability = async (req, res) => {
  try {

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.isManualOverride = true;

    item.isAvailable =
      req.body.isAvailable !== undefined
        ? req.body.isAvailable == "true" || req.body.isAvailable === true
        : !item.isAvailable;

    await item.save();

    res.json({
      success: true,
      message: "Item availability updated successfully",
      data: item,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// Resume Automatic (opening/closing time based) Availability
exports.resumeItemAutoAvailability = async (req, res) => {
  try {

    const item = await Item.findById(req.params.id).populate(
      "shop",
      "openingTime closingTime"
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    item.isManualOverride = false;
    item.isAvailable = item.getCurrentAvailability(
      item.shop?.openingTime,
      item.shop?.closingTime
    );

    await item.save();

    res.json({
      success: true,
      message: "Item resumed automatic availability",
      data: item,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// DELETE ITEM
exports.deleteItem = async (req, res) => {
  try {

    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    for (const img of item.images) {
      await deleteImage(img.public_id);
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: "Item deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};