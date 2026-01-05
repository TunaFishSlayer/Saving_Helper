import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTotalByType,
  getMonthlySummary,
  getExpenseByCategory
} from "../controllers/transactionController.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import {
  validateCreateTransaction,
  validateUpdateTransaction
} from "../middlewares/validateTransaction.js";

const router = express.Router();

router.use(authMiddleware);

// CRUD
router.post("/", validateCreateTransaction, createTransaction);
router.get("/", getTransactions);

// Analytics 
router.get("/summary/total", getTotalByType);
router.get("/summary/monthly", getMonthlySummary);
router.get("/summary/category", getExpenseByCategory);

// Single transaction
router.get("/:id", getTransactionById);
router.put("/:id", validateUpdateTransaction, updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
