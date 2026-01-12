// backend/src/routes/userRoute.js
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

import express from "express";
import {
  getProfile,
  updateUserProfile,
  deleteOwnAccount,
  updatePassword
} from "../controller/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import { 
  validateUpdateProfile, 
  validateUpdatePassword 
} from "../middlewares/validateUser.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/me", getProfile);

/**
 * @swagger
 * /api/users/me/update:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/me/update", validateUpdateProfile, updateUserProfile);

/**
 * @swagger
 * /api/users/me/updatePassword:
 *   put:
 *     summary: Update user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 */
router.put("/me/updatePassword", validateUpdatePassword, updatePassword);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Delete own account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 */
router.delete("/me", deleteOwnAccount);

export default router;