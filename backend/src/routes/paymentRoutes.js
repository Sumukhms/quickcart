/**
 * paymentRoutes.js — UPDATED
 *
 * Added refund endpoints:
 *   POST /api/payment/refund          — initiate refund
 *   GET  /api/payment/refund/:orderId — check refund status
 */
import express from "express";
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
} from "../controllers/paymentController.js";
import {
  initiateRefund,
  getRefundStatus,
} from "../controllers/refundController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";

const r = express.Router();

// Stricter rate limit for payment operations
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  { message: "Too many payment attempts. Please wait 15 minutes." },
  skip:     () => process.env.NODE_ENV === "development",
});

// ── Existing payment flow ─────────────────────────────────────
r.post("/create-order", protect, paymentLimiter, createRazorpayOrder);
r.post("/verify",       protect, paymentLimiter, verifyPaymentAndCreateOrder);

// ── Refund endpoints ──────────────────────────────────────────
r.post("/refund",             protect, initiateRefund);
r.get("/refund/:orderId",     protect, getRefundStatus);

export default r;