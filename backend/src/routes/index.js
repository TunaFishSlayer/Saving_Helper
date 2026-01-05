import express, { request } from "express";
import UserRoute from "./userRoute.js";
import AuthRoute from "./authRoute.js";
import { version } from "mongoose";
import { updatePassword } from "../controller/userController";
import { requestResetPassword } from "../controller/authController.js";
import CategoryRoute from "./categoryRoute.js";
import TransactionRoute from "./transactionRoute.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Savings Helper API",
    version: version,
    endpoint : 
    {
        auth:
        {
            register:" POST /api/auth/register",
            login: " POST /api/auth/login",
            googleLogin: " POST /api/auth/google",
            requestResetPassword: " POST /api/auth/request-reset-password",
            resetPassword: " POST /api/auth/reset-password"
        },
        users:
        {   
            getProfile: "GET /api/users/me",
            updateProfile: "PUT /api/users/me/update",
            updatePassword: "PUT /api/users/me/updatePassword",
            deleteAccount: "DELETE /api/users/me"
        },
    },});
});    

router.use("/api/users", UserRoute);
router.use("/api/auth", AuthRoute);
router.use("/api/categories", CategoryRoute);
router.use("/api/transactions", TransactionRoute);

export default router;
