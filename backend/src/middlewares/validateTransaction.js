import mongoose from "mongoose";

export const validateCreateTransaction = (req, res, next) => {
  const { categoryId, amount, type, date } = req.body;

  // Required fields
  if (!categoryId || !amount || !type || !date) {
    return res.status(400).json({
      message: "Missing required fields"
    });
  }

  // categoryId must be valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      message: "Invalid categoryId"
    });
  }

  // amount must be a positive number
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a positive number"
    });
  }

  // type validation
  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({
      message: "Invalid transaction type"
    });
  }

  // date validation
  if (isNaN(Date.parse(date))) {
    return res.status(400).json({
      message: "Invalid date format"
    });
  }

  next();
};

export const validateUpdateTransaction = (req, res, next) => {
  const { categoryId, amount, type, date } = req.body;

  // At least one field must be updated
  if (!categoryId && !amount && !type && !date && !req.body.description) {
    return res.status(400).json({
      message: "No update fields provided"
    });
  }

  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      message: "Invalid categoryId"
    });
  }

  if (amount && (typeof amount !== "number" || amount <= 0)) {
    return res.status(400).json({
      message: "Amount must be a positive number"
    });
  }

  if (type && !["income", "expense"].includes(type)) {
    return res.status(400).json({
      message: "Invalid transaction type"
    });
  }

  if (date && isNaN(Date.parse(date))) {
    return res.status(400).json({
      message: "Invalid date format"
    });
  }

  next();
};
