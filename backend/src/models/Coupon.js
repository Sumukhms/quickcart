import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: "" },
  discountType: { type: String, enum: ["percent", "flat", "free_delivery"], required: true },
  discountValue: { type: Number, default: 0 }, // percent or flat amount
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null }, // cap for percent coupons
  usageLimit: { type: Number, default: null }, // null = unlimited
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  applicableCategories: [{ type: String }], // empty = all categories
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);