import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { placeOrderv , getMyOrders } from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/my-orders", protect, getMyOrders);
export default router;