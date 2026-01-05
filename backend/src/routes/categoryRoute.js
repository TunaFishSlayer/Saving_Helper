import express from "express";
import {
  createCategory,
  getCategories,
  deleteCategory
} from "../controllers/categoryController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createCategory);
router.get("/", getCategories);
router.delete("/:id", deleteCategory);

export default router;