import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerUser, registerCustomer, loginUser, getMe, forgotPassword, resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Max 5 reset requests per 15 minutes from one IP
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Too many requests. Please try again after some time." },
});

// Max 10 reset attempts per 15 minutes (stops guessing tokens)
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Too many attempts. Please try again after some time." },
});

router.post("/register", registerUser);
router.post("/register-customer", registerCustomer);
router.post("/login", loginUser);
router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password/:token", resetLimiter, resetPassword);
router.get("/me", protect, getMe);

export default router;