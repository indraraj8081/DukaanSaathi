import express from "express";
import rateLimit from "express-rate-limit";
import {
  listShops, getShop, getShopProducts, createOrder, trackOrder,
} from "../controllers/publicController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Max 10 orders per 15 minutes from one IP (stops spam and fake orders)
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: "Too many orders from this device. Please try again later." },
});

router.get("/shops", listShops);
router.get("/shops/:shopId", getShop);
router.get("/shops/:shopId/products", getShopProducts);
router.post("/shops/:shopId/orders", orderLimiter, createOrder);
router.get("/orders/:code", trackOrder);
router.post("/shops/:shopId/orders", orderLimiter, optionalAuth, createOrder);

export default router;