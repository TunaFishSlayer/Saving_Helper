export const validateCreateCategory = (req, res, next) => {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      message: "Name and type are required"
    });
  }

  if (name.trim().length === 0) {
    return res.status(400).json({
      message: "Category name cannot be empty"
    });
  }

  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({
      message: "Type must be either 'income' or 'expense'"
    });
  }

  next();
};