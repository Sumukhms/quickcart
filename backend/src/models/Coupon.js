/**
 * Coupon.js — FIXED
 *
 * Bug fix: added per-user usage tracking via the `usages` array.
 *
 * Previously `usageLimit` was a global cap: the FIRST user to apply
 * the coupon consumed all of its uses. Now:
 *   - usageLimit  = max total uses across ALL users (global cap)
 *   - perUserLimit = max uses per individual user (default 1)
 *   - usages[]    = array of { userId, usedAt } for per-user tracking
 *
 * Example: "FREESHIP" with usageLimit=1000, perUserLimit=1
 *   → up to 1000 different users can each use it once.
 */
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: "" },
  discountType: { type: String, enum: ["percent", "flat", "free_delivery"], required: true },
  discountValue: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },

  // ── Global usage cap ──────────────────────────────────────
  usageLimit: { type: Number, default: null },   // null = unlimited
  usedCount:  { type: Number, default: 0 },      // total uses so far

  // ── Per-user usage cap (NEW) ──────────────────────────────
  perUserLimit: { type: Number, default: 1 },    // 1 = each user can use once

  // ── Per-user usage log (NEW) ──────────────────────────────
  // Kept lean: only userId + timestamp; grows with usages but pruned on deletion.
  usages: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      usedAt: { type: Date, default: Date.now },
    },
  ],

  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  applicableCategories: [{ type: String }],

  // null = platform-wide (admin coupon); set = store-specific coupon
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
}, { timestamps: true });

// Index for fast per-user lookup
couponSchema.index({ "usages.userId": 1 });

export default mongoose.model("Coupon", couponSchema);