import express from "express";
import { getSuppliers, createSupplier, deleteSupplier } from "../controllers/purchaseController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getSuppliers).post(createSupplier);
router.delete("/:id", deleteSupplier);

export default router;