/**
 * User model — UPDATED
 *
 * Changes:
 *   1. Added `favoriteStores` array (ObjectId refs to Store)
 *   2. Kept all existing fields unchanged
 */
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "store", "delivery"],
      default: "customer",
    },
    phone:   { type: String },
    // ── Legacy single address (kept for backward compat) ──
    address: { type: String },
    // ── NEW: multiple saved addresses (max 5) ─────────────
    addresses: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 addresses allowed",
      },
    },
    // ── NEW: favorite stores ───────────────────────────────
    favoriteStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],

    avatar: { type: String, default: "" },

    // Delivery partner specific
    vehicleType:     { type: String, enum: ["bike", "cycle", "scooter", ""], default: "" },
    isAvailable:     { type: Boolean, default: true },

    // Store owner specific
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    // Stats
    totalDeliveries: { type: Number, default: 0 },
    rating:          { type: Number, default: 5.0, min: 0, max: 5 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);