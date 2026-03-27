import express from "express";
import {
  createProduct,
  getProductsByStore,
  // getMyProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// Public — anyone can browse products of a store
r.get("/store/:storeId", getProductsByStore);

// Store owner — manage their own products (all, including unavailable)
// r.get("/mine", protect, restrictTo("store"), getMyProducts);
r.post("/", protect, restrictTo("store"), createProduct);
r.put("/:id", protect, restrictTo("store"), updateProduct);
r.delete("/:id", protect, restrictTo("store"), deleteProduct);

export default r;