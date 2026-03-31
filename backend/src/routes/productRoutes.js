import express from "express";
import {
  createProduct,
  getProductsByStore,
  searchProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// Public — search products across all stores
r.get("/search", searchProducts);

// Public — anyone can browse products of a store
r.get("/store/:storeId", getProductsByStore);

// Store owner — manage their own products
r.post("/", protect, restrictTo("store"), createProduct);
r.put("/:id", protect, restrictTo("store"), updateProduct);
r.delete("/:id", protect, restrictTo("store"), deleteProduct);

export default r;