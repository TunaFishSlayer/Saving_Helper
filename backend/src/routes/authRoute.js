import express from "express";
import {
  register,
  login,
  loginGoogle,
  requestResetPassword,
  resetPassword,
} from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../middlewares/validateAuth.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/google", loginGoogle);
router.post("/request-reset-password",requestResetPassword);
router.post("/reset-password", resetPassword);

export default router;
