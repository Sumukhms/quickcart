import express from "express";
import {
  createProduct,
  getProductsByStore,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
const r = express.Router();
r.get("/store/:storeId", getProductsByStore);
r.post("/", protect, restrictTo("store"), createProduct);
r.put("/:id", protect, restrictTo("store"), updateProduct);
r.delete("/:id", protect, restrictTo("store"), deleteProduct);
export default r;
