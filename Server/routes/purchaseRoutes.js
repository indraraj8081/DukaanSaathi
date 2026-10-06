import express from "express";
import { createPurchase, getPurchases } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getPurchases).post(createPurchase);

export default router;