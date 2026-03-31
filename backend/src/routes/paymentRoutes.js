/**
 * paymentRoutes.js
 *
 * Mount in server.js:
 *   import paymentRoutes from "./src/routes/paymentRoutes.js";
 *   app.use("/api/payment", paymentRoutes);
 */
import express from "express";
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const r = express.Router();

// Both routes require the user to be logged in
r.post("/create-order", protect, createRazorpayOrder);
r.post("/verify",       protect, verifyPaymentAndCreateOrder);

export default r;