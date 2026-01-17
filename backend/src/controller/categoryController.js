import CategoryService from "../services/CategoryService.js";

// POST /api/categories
export const createCategory = async (req, res) => {
  try {
    const category = await CategoryService.createCategory(
      req.user.userId,
      req.body
    );

    res.status(201).json({
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/categories

export const getCategories = async (req, res) => {
  try {
    const categories = await CategoryService.getUserCategories(
      req.user.userId,
      req.query.type
    );

    res.status(200).json(categories);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/categories/:id

export const deleteCategory = async (req, res) => {
  try {
    await CategoryService.deleteCategory(
      req.params.id,
      req.user.userId
    );

    res.status(200).json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    const category = await CategoryService.updateCategory(
      req.params.id,
      req.user.userId,
      req.body
    );
    res.status(200).json({
      message: "Category updated successfully",
      data: category
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};