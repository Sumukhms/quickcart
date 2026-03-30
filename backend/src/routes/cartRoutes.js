import express from "express";
import { getCart, addToCart, updateCartItem, clearCart } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";  // remove customerOnly import

const r = express.Router();
r.get("/",       protect, getCart);         // was: protect, customerOnly
r.post("/add",   protect, addToCart);       // was: protect, customerOnly
r.put("/update", protect, updateCartItem);  // was: protect, customerOnly
r.delete("/clear", protect, clearCart);     // was: protect, customerOnly
export default r;