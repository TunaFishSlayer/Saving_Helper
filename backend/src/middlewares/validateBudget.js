// backend/src/middlewares/validateBudget.js
import mongoose from "mongoose";

export const validateCreateBudget = (req, res, next) => {
  const { categoryId, amount, period, startDate } = req.body;

  // Required fields
  if (!categoryId || !amount || !period || !startDate) {
    return res.status(400).json({
      message: "Missing required fields: categoryId, amount, period, startDate"
    });
  }

  // Validate categoryId
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      message: "Invalid categoryId"
    });
  }

  // Validate amount
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      message: "Amount must be a positive number"
    });
  }

  // Validate period
  if (!["monthly", "yearly"].includes(period)) {
    return res.status(400).json({
      message: "Period must be either 'monthly' or 'yearly'"
    });
  }

  // Validate startDate
  if (isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      message: "Invalid start date format"
    });
  }

  // Validate endDate if provided
  if (req.body.endDate && isNaN(Date.parse(req.body.endDate))) {
    return res.status(400).json({
      message: "Invalid end date format"
    });
  }

  // Validate alertThreshold if provided
  if (req.body.alertThreshold !== undefined) {
    const threshold = req.body.alertThreshold;
    if (typeof threshold !== "number" || threshold < 0 || threshold > 100) {
      return res.status(400).json({
        message: "Alert threshold must be a number between 0 and 100"
      });
    }
  }

  next();
};

export const validateUpdateBudget = (req, res, next) => {
  const { categoryId, amount, period, startDate, endDate, alertThreshold, isActive } = req.body;

  // At least one field must be provided
  if (!categoryId && !amount && !period && !startDate && !endDate && 
      alertThreshold === undefined && isActive === undefined) {
    return res.status(400).json({
      message: "No update fields provided"
    });
  }

  // Validate categoryId if provided
  if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({
      message: "Invalid categoryId"
    });
  }

  // Validate amount if provided
  if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
    return res.status(400).json({
      message: "Amount must be a positive number"
    });
  }

  // Validate period if provided
  if (period && !["monthly", "yearly"].includes(period)) {
    return res.status(400).json({
      message: "Period must be either 'monthly' or 'yearly'"
    });
  }

  // Validate dates if provided
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(400).json({
      message: "Invalid start date format"
    });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(400).json({
      message: "Invalid end date format"
    });
  }

  // Validate alertThreshold if provided
  if (alertThreshold !== undefined) {
    if (typeof alertThreshold !== "number" || alertThreshold < 0 || alertThreshold > 100) {
      return res.status(400).json({
        message: "Alert threshold must be a number between 0 and 100"
      });
    }
  }

  // Validate isActive if provided
  if (isActive !== undefined && typeof isActive !== "boolean") {
    return res.status(400).json({
      message: "isActive must be a boolean"
    });
  }

  next();
};