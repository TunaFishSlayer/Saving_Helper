import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: "Validation error",
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: "Duplicate entry detected"
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: "Invalid token"
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: "Token expired"
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error"
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
};