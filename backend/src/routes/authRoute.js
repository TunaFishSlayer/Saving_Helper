// backend/src/routes/authRoute.js

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and authorization
 */
import express from "express";
import {
  register,
  login,
  loginGoogle,
  requestResetPassword,
  resetPassword,
} from "../controller/authController.js";
import { 
  validateRegister, 
  validateLogin,
  validateResetPasswordRequest,
  validateResetPassword
} from "../middlewares/validateAuth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *           example:
 *             email: user@example.com
 *             password: "123456"
 *             name: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Registration error
 */

router.post("/register", validateRegister, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *           example:
 *             email: user@example.com
 *             password: "123456"
 *     responses:
 *       200:
 *         description: Login success
 *       401:
 *         description: Invalid credentials
 */

router.post("/login", validateLogin, login);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login using Google OAuth
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [credential]
 *             properties:
 *               credential:
 *                 type: string
 *           example:
 *             credential: eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...
 *     responses:
 *       200:
 *         description: Google login success
 *       400:
 *         description: Invalid Google credential
 */
router.post("/google", loginGoogle);

/**
 * @swagger
 * /api/auth/request-reset-password:
 *   post:
 *     summary: Request password reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *           example:
 *             email: user@example.com
 *     responses:
 *       200:
 *         description: Reset code sent
 *       400:
 *         description: Failed to generate reset code
 */
router.post(
  "/request-reset-password",
  validateResetPasswordRequest,
  requestResetPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using reset code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *           example:
 *             email: user@example.com
 *             code: "123456"
 *             newPassword: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired reset code
 */
router.post("/reset-password", validateResetPassword, resetPassword);


export default router;