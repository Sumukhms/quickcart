/**
 * PayoutRequest.js
 *
 * Tracks delivery partner payout requests.
 * No real payment integration — toggles a DB flag so admins
 * can see pending requests and process them manually.
 *
 * Fields:
 *   deliveryPartnerId  – User._id of the delivery partner
 *   amount             – requested payout amount (₹)
 *   status             – "pending" | "processed" | "rejected"
 *   requestedAt        – timestamp of request
 *   processedAt        – timestamp when admin acted
 *   note               – optional admin note
 */
import mongoose from "mongoose";

const payoutRequestSchema = new mongoose.Schema(
  {
    deliveryPartnerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    amount: {
      type:     Number,
      required: true,
      min:      [1, "Payout amount must be at least ₹1"],
    },
    status: {
      type:    String,
      enum:    ["pending", "processed", "rejected"],
      default: "pending",
      index:   true,
    },
    processedAt: {
      type:    Date,
      default: null,
    },
    note: {
      type:    String,
      default: "",
    },
  },
  { timestamps: true }
);

// One pending request per partner at a time
payoutRequestSchema.index(
  { deliveryPartnerId: 1, status: 1 },
  { unique: false }
);

export default mongoose.model("PayoutRequest", payoutRequestSchema);