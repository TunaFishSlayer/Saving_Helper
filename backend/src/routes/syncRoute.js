import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { syncData, pullUpdates } from "../controller/syncController.js";

const router = express.Router();

// Both operations require device/auth credentials
router.use(authMiddleware);

router.post("/", syncData);
router.get("/pull", pullUpdates);

export default router;
