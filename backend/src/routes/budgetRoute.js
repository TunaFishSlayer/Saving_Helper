// backend/src/routes/budgetRoute.js

/**
 * @swagger
 * tags:
 *   name: Budgets
 *   description: Budget management
 */

import express from "express";
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  deactivateBudget,
  getBudgetStatus,
  getBudgetOverview,
  getBudgetAlerts
} from "../controller/budgetController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  validateCreateBudget,
  validateUpdateBudget
} from "../middlewares/validateBudget.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Overview and alerts (must come before :id routes)
router.get("/overview", getBudgetOverview);
router.get("/alerts", getBudgetAlerts);

// CRUD operations
/**
 * @swagger
 * /api/budgets:
 *   post:
 *     summary: Create a new budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: string
 *               amount:
 *                 type: number
 *               period:
 *                 type: string
 *             example:
 *               categoryId: 64f1a2b3c4d5e6f7a8b9c0
 *               amount: 500
 *               period: monthly
 *     responses:
 *       201:
 *         description: Budget created successfully
 *       400:
 *         description: Budget creation error
 */
router.post("/", validateCreateBudget, createBudget);

/**
 * @swagger
 * /api/budgets:
 *   get:
 *     summary: Get all budgets of the current user
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *       - name: isActive
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: categoryId
 *         in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budgets retrieved successfully
 *       400:
 *         description: Failed to retrieve budgets
 */
router.get("/", getBudgets);

/**
 * @swagger
 * /api/budgets/{id}:
 *   get:
 *     summary: Get a budget by ID
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget retrieved successfully
 *       404:
 *         description: Budget not found
 */
router.get("/:id", getBudgetById);

/**
 * @swagger
 * /api/budgets/{id}:
 *   put:
 *     summary: Update a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *               period:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *           example:
 *             amount: 700
 *             period: monthly
 *     responses:
 *       200:
 *         description: Budget updated successfully
 *       400:
 *         description: Update budget failed
 */
router.put("/:id", validateUpdateBudget, updateBudget);


/**
 * @swagger
 * /api/budgets/{id}:
 *   delete:
 *     summary: Delete a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget deleted successfully
 *       404:
 *         description: Budget not found
 */

router.delete("/:id", deleteBudget);

// Additional operations
/**
 * @swagger
 * /api/budgets/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a budget
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget deactivated successfully
 *       404:
 *         description: Budget not found
 */
router.patch("/:id/deactivate", deactivateBudget);

/**
 * @swagger
 * /api/budgets/{id}/status:
 *   get:
 *     summary: Get budget status
 *     tags: [Budgets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Budget status retrieved successfully
 *       404:
 *         description: Budget not found
 */
router.get("/:id/status", getBudgetStatus);

export default router;