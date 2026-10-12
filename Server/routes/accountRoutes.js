import express from "express";
import {
  getAddresses, addAddress, deleteAddress, getMyOrders, cancelMyOrder,
} from "../controllers/accountController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, authorize("customer"));

router.route("/addresses").get(getAddresses).post(addAddress);
router.delete("/addresses/:id", deleteAddress);
router.get("/orders", getMyOrders);
router.post("/orders/:id/cancel", cancelMyOrder);

export default router;