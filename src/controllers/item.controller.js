const Item = require("../models/Item");
const Shop = require("../models/Shop");
const Category = require("../models/Category");

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

      price: Number(req.body.price),

      offerPrice:
        Number(req.body.offerPrice || 0),

      unit:
        req.body.unit || "pcs",

      stock:
        Number(req.body.stock || 0),

      isVeg:
        req.body.isVeg == "true",

      isAvailable:
        req.body.isAvailable == "true",

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
          "name phone image"
        )

        .populate(
          "category",
          "name image"
        )

        .sort({
          displayOrder: 1,
        });

    res.json({

      success: true,

      count: items.length,

      data: items,

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

    res.json({

      success: true,

      data: item,

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

    if (req.body.price !== undefined)
      item.price = Number(req.body.price);

    if (req.body.offerPrice !== undefined)
      item.offerPrice = Number(req.body.offerPrice);

    if (req.body.unit !== undefined)
      item.unit = req.body.unit;

    if (req.body.stock !== undefined)
      item.stock = Number(req.body.stock);

    if (req.body.isVeg !== undefined)
      item.isVeg = req.body.isVeg == "true";

    if (req.body.isAvailable !== undefined)
      item.isAvailable = req.body.isAvailable == "true";

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