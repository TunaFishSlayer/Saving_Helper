// backend/src/routes/index.js
import express from "express";
import UserRoute from "./userRoute.js";
import AuthRoute from "./authRoute.js";
import CategoryRoute from "./categoryRoute.js";
import TransactionRoute from "./transactionRoute.js";
import BudgetRoute from "./budgetRoute.js";
import GoalRoute from "./goalRoutes.js";
import SubscriptionRoute from "./subscriptionRoutes.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 */

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API documentation endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Savings Helper API",
    version: "1.0.0",
    links: {
  docs: "/api-docs",
  health: "/api/health"
  }  });
});

// Apply general rate limiting to all API routes
router.use(apiLimiter);

// Mount route modules
router.use("/users", UserRoute);
router.use("/auth", AuthRoute);
router.use("/categories", CategoryRoute);
router.use("/transactions", TransactionRoute);
router.use("/budgets", BudgetRoute);
router.use("/goals", GoalRoute);
router.use("/subscriptions", SubscriptionRoute);

export default router;