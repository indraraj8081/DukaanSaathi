import express from "express";
import { createBill, getBills, getBill } from "../controllers/billController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getBills).post(createBill);
router.get("/:id", getBill);

export default router;