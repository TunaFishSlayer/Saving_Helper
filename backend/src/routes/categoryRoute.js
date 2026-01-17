// backend/src/routes/categoryRoute.js

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */
import express from "express";
import {
  createCategory,
  getCategories,
  deleteCategory
} from "../controller/categoryController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validateCreateCategory } from "../middlewares/validateCategory.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *             example:
 *               name: Food
 *               type: expense
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Category creation failed
 */
router.post("/", validateCreateCategory, createCategory);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories of the current user
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         description: Filter by category type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       400:
 *         description: Failed to retrieve categories
 */
router.get("/", getCategories);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
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
 *         description: Category deleted successfully
 *       400:
 *         description: Category not found or cannot be deleted
 */
router.delete("/:id", deleteCategory);


router.put("/:id", validateCreateCategory, updateCategory);
export default router;