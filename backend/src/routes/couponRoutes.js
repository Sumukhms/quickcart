// ══════════════════════════════════════════════════════════════════
// FEATURE 7a: Rate Limiting for Coupon Validation
// FILE: backend/src/routes/couponRoutes.js
// ══════════════════════════════════════════════════════════════════

import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  validateCoupon,
  createCoupon,
  listCoupons,
} from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const r = express.Router();

// ✅ ADD: Strict rate limit — 10 requests per minute per IP for coupon validation
const couponLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(req) + (req.user?.userId || "anon"),
  message: { message: "Too many coupon attempts. Please wait 1 minute." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "development",
});

r.post("/validate", protect, couponLimiter, validateCoupon); // ✅ rate-limited
r.get("/", protect, listCoupons);
r.post("/", protect, createCoupon);

export default r;
