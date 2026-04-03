/**
 * notificationService.js
 *
 * Centralised helper used by orderController, paymentController,
 * and webhookRoutes to create DB notifications AND emit Socket.IO
 * events to the affected user in one call.
 *
 * Usage:
 *   import { notify } from "../services/notificationService.js";
 *
 *   await notify(io, {
 *     userId:   order.userId,
 *     title:    "Order Confirmed ✅",
 *     message:  "Your order from FreshMart has been confirmed.",
 *     type:     "order",
 *     refId:    order._id,
 *     refModel: "Order",
 *   });
 *
 * The socket.io `io` instance is attached to req.io in server.js.
 * Pass it through or import it if you have a singleton approach.
 */
import Notification from "../models/Notification.js";

/**
 * Create a notification record and push it to the user's socket room.
 *
 * @param {import("socket.io").Server|null} io  - Socket.IO server instance
 * @param {object}  opts
 * @param {string}  opts.userId   - recipient user _id (string or ObjectId)
 * @param {string}  opts.title    - short notification title
 * @param {string}  opts.message  - full notification body
 * @param {string}  [opts.type]   - "order" | "payment" | "delivery" | "system"
 * @param {*}       [opts.refId]  - related document _id (e.g. orderId)
 * @param {string}  [opts.refModel] - "Order" | "Store" | null
 * @returns {Promise<object>}     - saved Notification document
 */
export async function notify(io, { userId, title, message, type = "order", refId = null, refModel = null }) {
  try {
    const doc = await Notification.create({
      userId,
      title,
      message,
      type,
      refId:    refId   || null,
      refModel: refModel || null,
    });

    // Emit to user-specific room: "user_<userId>"
    // The frontend joins this room on login via useSocket hook.
    if (io) {
      io.to(`user_${userId.toString()}`).emit("notification", {
        _id:       doc._id,
        title:     doc.title,
        message:   doc.message,
        type:      doc.type,
        refId:     doc.refId,
        refModel:  doc.refModel,
        isRead:    false,
        createdAt: doc.createdAt,
      });
    }

    return doc;
  } catch (err) {
    // Non-fatal — log but don't crash the calling controller
    console.error("[NotificationService] Failed to create notification:", err.message);
    return null;
  }
}

/**
 * Convenience wrappers for common notification patterns.
 */

export async function notifyOrderStatus(io, { userId, orderId, storeName, status }) {
  const MAP = {
    pending:          { title: "Order Placed 🛒",         message: `Your order from ${storeName} has been placed successfully.` },
    confirmed:        { title: "Order Confirmed ✅",       message: `${storeName} confirmed your order and will start preparing it soon.` },
    preparing:        { title: "Preparing Your Order 👨‍🍳", message: `${storeName} is now preparing your food. Sit tight!` },
    packing:          { title: "Packing Your Items 📦",   message: `${storeName} is packing your items carefully.` },
    ready_for_pickup: { title: "Ready for Pickup 🛍️",    message: `Your order is packed and waiting for a delivery partner.` },
    out_for_delivery: { title: "Out for Delivery 🛵",     message: `A rider is on the way with your order from ${storeName}!` },
    delivered:        { title: "Order Delivered 🎉",       message: `Your order from ${storeName} has been delivered. Enjoy!` },
    cancelled:        { title: "Order Cancelled ❌",       message: `Your order from ${storeName} has been cancelled.` },
  };

  const content = MAP[status];
  if (!content) return;

  return notify(io, {
    userId,
    title:    content.title,
    message:  content.message,
    type:     "order",
    refId:    orderId,
    refModel: "Order",
  });
}

export async function notifyPayment(io, { userId, orderId, amount, status }) {
  const MAP = {
    paid: {
      title:   "Payment Successful 💳",
      message: `₹${amount} has been charged successfully. Your order is confirmed.`,
    },
    refunded: {
      title:   "Refund Processed 💰",
      message: `₹${amount} refund has been initiated and will reflect in 3–5 business days.`,
    },
    failed: {
      title:   "Payment Failed ⚠️",
      message: `Your payment of ₹${amount} could not be processed. Please try again.`,
    },
  };

  const content = MAP[status];
  if (!content) return;

  return notify(io, {
    userId,
    title:    content.title,
    message:  content.message,
    type:     "payment",
    refId:    orderId,
    refModel: "Order",
  });
}

export async function notifyDelivery(io, { userId, orderId, agentName }) {
  return notify(io, {
    userId,
    title:   "Rider Assigned 🛵",
    message: `${agentName || "A delivery partner"} has accepted your order and is heading to the store.`,
    type:    "delivery",
    refId:   orderId,
    refModel:"Order",
  });
}