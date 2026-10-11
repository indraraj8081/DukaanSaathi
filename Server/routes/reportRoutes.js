import express from "express";
import { getReport } from "../controllers/reportController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, authorize("shopkeeper"), getReport);   // reportRoutes: getReport

export default router;