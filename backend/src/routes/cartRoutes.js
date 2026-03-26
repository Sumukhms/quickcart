import express from "express";
import { getCart, addToCart, updateCartItem, clearCart } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
const r = express.Router();
r.get("/", protect, getCart);
r.post("/add", protect, addToCart);
r.put("/update", protect, updateCartItem);
r.delete("/clear", protect, clearCart);
export default r;