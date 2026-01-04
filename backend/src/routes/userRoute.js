// routes/userRoute.js
import express from "express";
import {
  getProfile,
  updateUserProfile,
  deleteOwnAccount
} from "../controller/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getProfile);
router.put("/me/update", authMiddleware, updateUserProfile);

// Allow authenticated user to delete their own account
router.delete("/me", authMiddleware, deleteOwnAccount);

export default router;