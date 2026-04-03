/**
 * refundController.js
 *
 * Handles Razorpay refund operations.
 *
 * Routes (mounted at /api/payment):
 *   POST /api/payment/refund          — initiate a refund (customer or admin)
 *   GET  /api/payment/refund/:orderId — check refund status
 *
 * Refund policy:
 *   - Full refund: order is cancelled before delivery
 *   - Partial refund: admin-initiated for specific items
 *   - Only online-paid orders can be refunded via Razorpay
 *   - COD orders: manual process (flag in DB only)
 */
import Razorpay from "razorpay";
import Order    from "../models/Order.js";

const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

function getRazorpay() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw Object.assign(
      new Error("Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env."),
      { configError: true }
    );
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

// ── POST /api/payment/refund ──────────────────────────────────
export const initiateRefund = async (req, res) => {
  try {
    const { orderId, reason = "customer_request", amount } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Authorisation: customer (own order) or admin
    const isOwner = order.userId.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorised to refund this order" });
    }

    // ── Already refunded ─────────────────────────────────────
    if (order.refundStatus === "refunded") {
      return res.status(400).json({
        message:      "This order has already been refunded.",
        refundId:     order.refundId,
        refundStatus: order.refundStatus,
      });
    }
    if (order.refundStatus === "pending") {
      return res.status(400).json({
        message:      "A refund is already being processed for this order.",
        refundStatus: order.refundStatus,
      });
    }

    // ── COD orders: mark for manual refund ───────────────────
    if (order.paymentMethod === "cod") {
      await Order.findByIdAndUpdate(orderId, {
        refundStatus: "manual_pending",
        refundReason: reason,
        refundInitiatedAt: new Date(),
      });
      return res.json({
        message: "COD order flagged for manual refund processing.",
        refundStatus: "manual_pending",
      });
    }

    // ── Online payment: no paymentId stored ──────────────────
    if (!order.paymentId) {
      return res.status(400).json({
        message: "No payment ID found for this order. Cannot process refund.",
      });
    }

    // ── Determine refund amount ───────────────────────────────
    // amount in body is in ₹, Razorpay expects paise
    const refundAmountPaise = amount
      ? Math.round(Number(amount) * 100)
      : Math.round(order.totalPrice * 100); // full refund

    if (refundAmountPaise <= 0) {
      return res.status(400).json({ message: "Invalid refund amount" });
    }

    // ── Call Razorpay refunds API ─────────────────────────────
    const razorpay     = getRazorpay();
    const refundResult = await razorpay.payments.refund(order.paymentId, {
      amount:   refundAmountPaise,
      speed:    "normal",       // "optimum" for instant, "normal" for 5–7 days
      notes: {
        orderId:  orderId,
        reason,
        initiatedBy: req.user.userId,
      },
    });

    // ── Update order in DB ────────────────────────────────────
    const isFullRefund = refundAmountPaise === Math.round(order.totalPrice * 100);
    await Order.findByIdAndUpdate(orderId, {
      refundId:          refundResult.id,
      refundStatus:      "pending",         // Razorpay processes async
      refundAmount:      refundAmountPaise / 100,
      refundReason:      reason,
      refundInitiatedAt: new Date(),
      // If full refund + cancellation
      ...(isFullRefund && order.status !== "delivered"
        ? {
            status: "cancelled",
            $push: {
              statusHistory: {
                status:    "cancelled",
                timestamp: new Date(),
                updatedBy: req.user.userId,
              },
            },
          }
        : {}),
    });

    res.json({
      message:      "Refund initiated successfully.",
      refundId:     refundResult.id,
      refundStatus: refundResult.status,
      amount:       refundAmountPaise / 100,
      eta:          "3–5 business days",
    });
  } catch (e) {
    console.error("[Refund] initiateRefund error:", e.message);

    if (e.configError) {
      return res.status(500).json({ message: e.message, configError: true });
    }

    // Razorpay API errors have a structured error field
    const razorError = e.error || e;
    if (razorError?.description) {
      return res.status(400).json({
        message:      razorError.description,
        razorpayCode: razorError.code,
      });
    }

    res.status(500).json({ message: "Failed to initiate refund. Please try again." });
  }
};

// ── GET /api/payment/refund/:orderId ─────────────────────────
export const getRefundStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      "userId refundId refundStatus refundAmount refundReason refundInitiatedAt paymentMethod paymentId totalPrice"
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Authorisation
    const isOwner = order.userId.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorised" });
    }

    // If we have a Razorpay refund ID, fetch live status
    if (order.refundId) {
      try {
        const razorpay = getRazorpay();
        const liveRefund = await razorpay.refunds.fetch(order.refundId);

        // Sync status to DB if it changed
        if (liveRefund.status === "processed" && order.refundStatus !== "refunded") {
          await Order.findByIdAndUpdate(orderId, { refundStatus: "refunded" });
        }

        return res.json({
          refundId:     liveRefund.id,
          refundStatus: liveRefund.status === "processed" ? "refunded" : liveRefund.status,
          amount:       liveRefund.amount / 100,
          reason:       order.refundReason,
          initiatedAt:  order.refundInitiatedAt,
        });
      } catch (fetchErr) {
        console.warn("[Refund] could not fetch live status:", fetchErr.message);
        // Fall through to return DB status
      }
    }

    res.json({
      refundId:     order.refundId,
      refundStatus: order.refundStatus || "none",
      amount:       order.refundAmount,
      reason:       order.refundReason,
      initiatedAt:  order.refundInitiatedAt,
    });
  } catch (e) {
    console.error("[Refund] getRefundStatus error:", e.message);
    res.status(500).json({ message: e.message });
  }
};