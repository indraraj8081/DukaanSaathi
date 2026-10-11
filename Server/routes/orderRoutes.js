import express from "express";
import { getOrders, getOrderCounts, updateOrderStatus } from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("shopkeeper"));

router.get("/", getOrders);
router.get("/counts", getOrderCounts); // above "/:id"
router.patch("/:id/status", updateOrderStatus);

export default router;