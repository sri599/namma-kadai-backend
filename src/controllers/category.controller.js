const Category = require("../models/ShopCategory");

const {
  uploadImage,
  deleteImage,
} = require("../services/cloudinary.service");


// Create Category
exports.createCategory = async (req, res) => {
  try {

    let image = {
      url: "",
      public_id: "",
    };

    if (req.file) {

      const uploaded = await uploadImage(
        req.file.buffer,
        "categories"
      );

      image = {
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      };
    }

    const category = await Category.create({

      name: {
        en: req.body.name_en,
        ta: req.body.name_ta,
      },

      description: {
        en: req.body.description_en || "",
        ta: req.body.description_ta || "",
      },

      displayOrder: req.body.displayOrder || 0,

      image,

      isActive:
        req.body.isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



// Get All
exports.getCategories = async (req, res) => {

  try {

    const categories = await Category.find()
      .sort({
        displayOrder: 1,
      });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// Get By Id
exports.getCategoryById = async (
  req,
  res
) => {

  try {

    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {

      return res.status(404).json({
        success: false,
        message:
          "Category not found",
      });

    }

    res.json({
      success: true,
      data: category,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// Update
exports.updateCategory = async (
  req,
  res
) => {

  try {

    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {

      return res.status(404).json({
        success: false,
        message:
          "Category not found",
      });

    }

    if (req.file) {

      await deleteImage(
        category.image.public_id
      );

      const uploaded =
        await uploadImage(
          req.file.buffer,
          "categories"
        );

      category.image = {
        url: uploaded.secure_url,
        public_id:
          uploaded.public_id,
      };

    }

    if (req.body.name_en)
      category.name.en =
        req.body.name_en;

    if (req.body.name_ta)
      category.name.ta =
        req.body.name_ta;

    if (
      req.body.description_en !==
      undefined
    )
      category.description.en =
        req.body.description_en;

    if (
      req.body.description_ta !==
      undefined
    )
      category.description.ta =
        req.body.description_ta;

    if (
      req.body.displayOrder !==
      undefined
    )
      category.displayOrder =
        req.body.displayOrder;

    if (
      req.body.isActive !==
      undefined
    )
      category.isActive =
        req.body.isActive;

    await category.save();

    res.json({
      success: true,
      message:
        "Category updated successfully",
      data: category,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};


// Delete
exports.deleteCategory = async (
  req,
  res
) => {

  try {

    const category =
      await Category.findById(
        req.params.id
      );

    if (!category) {

      return res.status(404).json({
        success: false,
        message:
          "Category not found",
      });

    }

    await deleteImage(
      category.image.public_id
    );

    await category.deleteOne();

    res.json({
      success: true,
      message:
        "Category deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};