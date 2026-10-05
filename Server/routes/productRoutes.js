import express from "express";
import {
  createProduct,
  getProducts,
  getCategories,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // every product route requires login

router.route("/").get(getProducts).post(createProduct);
router.get("/categories", getCategories); // must be above "/:id"
router.route("/:id").put(updateProduct).delete(deleteProduct);

export default router;