const Item = require("../models/Item");
const Shop = require("../models/Shop");
const Category = require("../models/MenuCategory");
// actualPrice is required. sellingPrice defaults to actualPrice and
// discountPrice defaults to 0 when not sent — otherwise each value is used
// exactly as given, with no derivation between them.
function computePricing(body) {
  const actualPrice = Number(body.actualPrice);

  const sellingPrice =
    body.sellingPrice !== undefined ? Number(body.sellingPrice) : actualPrice;

  const discountPrice =
    body.discountPrice !== undefined ? Number(body.discountPrice) : 0;

  return { actualPrice, sellingPrice, discountPrice };
}

const {
  uploadImage,
  deleteImage,
} = require("../services/cloudinary.service");


exports.getItemsByShop = async (req, res) => {
  try {
    const items = await Item.find({
      shop: req.params.shopId,
      isActive: true,
    })
      .populate("shop", "openingTime closingTime")
      .populate("category", "name image")
      .sort({ displayOrder: 1 });

    const data = items.map((item) => {
      const obj = item.toObject();
      obj.isAvailable = item.getCurrentAvailability(
        item.shop?.openingTime,
        item.shop?.closingTime
      );
      return obj;
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
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

    const pricing = computePricing(req.body);

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
      const pricing = computePricing({
        actualPrice: req.body.actualPrice ?? item.actualPrice,
        sellingPrice: req.body.sellingPrice,
        discountPrice: req.body.discountPrice,
      });
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