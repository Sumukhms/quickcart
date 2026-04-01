import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: "" },
  discountType: { type: String, enum: ["percent", "flat", "free_delivery"], required: true },
  discountValue: { type: Number, default: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  applicableCategories: [{ type: String }],
  // null = platform-wide (admin coupon); set = store-specific coupon
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);