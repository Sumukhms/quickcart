/**
 * Order.js — UPDATED
 *
 * New fields:
 *   deliveryLat  {Number}  customer's delivery address latitude (from structured Address)
 *   deliveryLng  {Number}  customer's delivery address longitude (from structured Address)
 *
 * These are populated in orderController.placeOrder and paymentController.verifyPaymentAndCreateOrder
 * when the request body includes { deliveryLat, deliveryLng } from the frontend checkout.
 *
 * Used by:
 *   - DeliveryNearBanner  — compares rider GPS vs customer coords
 *   - UserTrack           — passes userCoords to DeliveryNearBanner
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

  // ── NEW: customer's GPS coordinates for proximity banner ──────
  deliveryLat: { type: Number, default: null },
  deliveryLng: { type: Number, default: null },
  // ─────────────────────────────────────────────────────────────

  status: {
    type: String,
    enum: [
      "pending", "confirmed", "preparing", "packing",
      "ready_for_pickup", "out_for_delivery", "delivered", "cancelled",
    ],
    default: "pending",
  },

  paymentMethod: { type: String, enum: ["cod", "online", "upi", "card"], default: "cod" },

  paymentStatus: {
    type:    String,
    enum:    ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentId: { type: String, default: null },

  // Refund tracking
  refundId:          { type: String,  default: null },
  refundStatus: {
    type:    String,
    enum:    ["none", "pending", "refunded", "manual_pending", "failed"],
    default: "none",
  },
  refundAmount:      { type: Number, default: null },
  refundReason:      { type: String, default: null },
  refundInitiatedAt: { type: Date,   default: null },

  estimatedTime: { type: String, default: "30-40 min" },

  deliveryLocation: {
    lat:       { type: Number },
    lng:       { type: Number },
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