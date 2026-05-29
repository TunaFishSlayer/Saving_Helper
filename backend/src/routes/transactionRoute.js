// backend/src/routes/transactionRoute.js
import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getTotalByType,
  getMonthlySummary,
  getExpenseByCategory,
  scanReceipt,
  exportTransactions
} from "../controller/transactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import multer from "multer";
import fs from "fs";

// Ensure standard upload directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

import {
  validateCreateTransaction,
  validateUpdateTransaction
} from "../middlewares/validateTransaction.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, categoryId]
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               categoryId:
 *                 type: string
 *               note:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *           example:
 *             amount: 250
 *             type: expense
 *             categoryId: 65ab1234
 *             note: Lunch
 *             date: 2025-01-10
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid input
 */
router.post("/", validateCreateTransaction, createTransaction);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get user transactions with filters
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get("/", getTransactions);

// Analytics endpoints

/**
 * @swagger
 * /api/transactions/summary/total:
 *   get:
 *     summary: Get total income or expense
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *     responses:
 *       200:
 *         description: Total amount returned
 *       400:
 *         description: Invalid type
 */
router.get("/summary/total", getTotalByType);

/**
 * @swagger
 * /api/transactions/summary/monthly:
 *   get:
 *     summary: Get monthly transaction summary
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Monthly summary retrieved
 *       400:
 *         description: Invalid year or month
 */
router.get("/summary/monthly", getMonthlySummary);

/**
 * @swagger
 * /api/transactions/summary/category:
 *   get:
 *     summary: Get expense grouped by category
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expense data by category
 */
router.get("/summary/category", getExpenseByCategory);

router.get("/export", exportTransactions);

// Single transaction operations
/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               categoryId:
 *                 type: string
 *               note:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 */
router.put("/:id", validateUpdateTransaction, updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 */
router.delete("/:id", deleteTransaction);

/**
 * @swagger
 * /api/transactions/scan-receipt:
 *   post:
 *     summary: Scan a receipt image and get structured JSON
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully scanned receipt
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Internal server error during OCR
 */
router.post("/scan-receipt", upload.single("receipt"), scanReceipt);

export default router;