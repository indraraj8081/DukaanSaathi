import express from "express";
import {
  getStats, listShops, listCustomers, setUserStatus, listOrders,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { getOverview, listProducts } from "../controllers/adminController.js";

const router = express.Router();

// Every admin route needs login AND the admin role
router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/shops", listShops);
router.get("/customers", listCustomers);
router.get("/orders", listOrders);
router.patch("/users/:id/status", setUserStatus);
router.get("/overview", getOverview);
router.get("/products", listProducts);

export default router;