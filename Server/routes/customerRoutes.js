import express from "express";
import {
  createCustomer, getCustomers, updateCustomer,
  deleteCustomer, receivePayment, getLedger,
} from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getCustomers).post(createCustomer);
router.route("/:id").put(updateCustomer).delete(deleteCustomer);
router.post("/:id/payments", receivePayment);
router.get("/:id/ledger", getLedger);

export default router;