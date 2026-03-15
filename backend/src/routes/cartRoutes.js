import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addToCart, getCart } from "../controllers/cartController.js";

const router = express.Router();

router.post("/add", protect, addToCart);
router.get("/", protect, getCart);

export default router;