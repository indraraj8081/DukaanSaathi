import express from "express";
import {
  createCustomer, getCustomers, updateCustomer,
  deleteCustomer, receivePayment, getLedger,
} from "../controllers/customerController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("shopkeeper"));

router.route("/").get(getCustomers).post(createCustomer);
router.route("/:id").put(updateCustomer).delete(deleteCustomer);
router.post("/:id/payments", receivePayment);
router.get("/:id/ledger", getLedger);

export default router;