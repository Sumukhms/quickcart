/**
 * Order.js — UPDATED
 *
 * Changes:
 *   + paymentStatus: "pending" | "paid" | "failed"
 *   + paymentId:     String (Razorpay payment ID, stored after verification)
 *
 * Everything else is unchanged from the original.
 */
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  storeId:         { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  deliveryAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name:      { type: String,  required: true },
    price:     { type: Number,  required: true },
    quantity:  { type: Number,  required: true },
    image:     { type: String },
  }],

  totalPrice:      { type: Number, required: true },
  deliveryFee:     { type: Number, default: 20 },
  deliveryAddress: { type: String, required: true },

  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "preparing",
      "packing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ],
    default: "pending",
  },

  paymentMethod: { type: String, enum: ["cod", "online", "upi", "card"], default: "cod" },

  // ── NEW: Razorpay payment tracking ───────────────────────
  paymentStatus: {
    type:    String,
    enum:    ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentId: {
    type:    String,  // Razorpay payment_id e.g. "pay_xxxxxxxxxxxx"
    default: null,
  },
  // ─────────────────────────────────────────────────────────

  estimatedTime: { type: String, default: "30-40 min" },

  deliveryLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date },
  },

  statusHistory: [{
    status:    String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  }],

  notes:                { type: String },
  isAcceptedByDelivery: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);