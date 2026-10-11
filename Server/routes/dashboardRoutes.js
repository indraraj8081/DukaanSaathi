import express from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/", protect, authorize("shopkeeper"), getDashboard);   // reportRoutes: getReport

export default router;