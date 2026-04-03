/**
 * Notification.js
 *
 * Stores in-app notifications for all user roles.
 * TTL index auto-deletes notifications older than 30 days.
 *
 * type values:
 *   "order"    – order lifecycle events (placed, confirmed, delivered…)
 *   "payment"  – payment captured, refund processed
 *   "delivery" – rider assigned, location updates
 *   "system"   – platform-wide messages, coupon alerts
 */
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    title: {
      type:     String,
      required: true,
      trim:     true,
    },
    message: {
      type:     String,
      required: true,
      trim:     true,
    },
    type: {
      type:    String,
      enum:    ["order", "payment", "delivery", "system"],
      default: "order",
    },
    // Optional reference to the related document
    refId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },
    refModel: {
      type:    String,
      enum:    ["Order", "Store", null],
      default: null,
    },
    isRead: {
      type:    Boolean,
      default: false,
      index:   true,
    },
    // Auto-expire after 30 days
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB removes expired documents automatically
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast "unread count" queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);