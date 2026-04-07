/**
 * webhookRoutes.js — UPDATED
 *
 * Changes vs original:
 *   - payment.failed: now creates a Notification for the user and logs the failure
 *     on the matching Order document (sets paymentStatus: "failed")
 *   - refund.processed: now creates a Notification for the user confirming the refund
 *   - All existing behaviour preserved
 */
import express from "express";
import crypto from "crypto";
import Order from "../models/Order.js";
import { notify } from "../services/notificationService.js";

const r = express.Router();
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// ── Raw body parser ────────────────────────────────────────────
r.use(express.raw({ type: "application/json" }));

// ── POST /api/webhook/razorpay ─────────────────────────────────
r.post("/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  // 1. Signature verification
  if (!WEBHOOK_SECRET) {
    console.warn(
      "[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping check (unsafe!)",
    );
  } else {
    if (!signature) {
      console.warn("[Webhook] Missing X-Razorpay-Signature");
      return res.status(400).json({ message: "Missing signature" });
    }
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      console.warn("[Webhook] Signature mismatch");
      return res.status(400).json({ message: "Invalid signature" });
    }
  }

  // 2. Parse payload
  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  const event = payload.event;
  const entity =
    payload.payload?.payment?.entity ||
    payload.payload?.refund?.entity ||
    payload.payload?.order?.entity;

  console.log(`[Webhook] Event: ${event}`);

  try {
    switch (event) {
      // ── payment.captured ─────────────────────────────────────
      case "payment.captured": {
        const paymentId = entity?.id;
        if (paymentId) {
          const updated = await Order.findOneAndUpdate(
            { paymentId },
            { paymentStatus: "paid" },
            { new: true },
          );
          if (updated) {
            console.log(
              `[Webhook] payment.captured → order ${updated._id} marked paid`,
            );
            // ✅ Emit real-time update to customer's socket room
            req.io
              ?.to(`user_${updated.userId.toString()}`)
              .emit("payment_update", {
                orderId: updated._id,
                paymentStatus: "paid",
                message: "Payment successful! Your order is confirmed.",
              });
            // Also emit to the order room so tracking page updates
            req.io?.to(`order_${updated._id}`).emit("payment_update", {
              orderId: updated._id,
              paymentStatus: "paid",
            });
          }
        }
        break;
      }

      // ── payment.failed ───────────────────────────────────────
      // FIX: was only logging. Now also:
      //   a) marks the order's paymentStatus = "failed"
      //   b) creates a notification so the user sees it in-app
      case "payment.failed": {
        const reason = entity?.error_description || "Unknown reason";
        const razorpayOrderId = entity?.order_id;
        const razorpayPaymentId = entity?.id;

        console.warn(
          `[Webhook] payment.failed — rp_order: ${razorpayOrderId}, reason: ${reason}`,
        );

        // Try to find the order via the razorpay order_id stored in paymentId field,
        // OR via a recent "pending" order that matches the amount (best-effort).
        // Note: we don't store razorpayOrderId on the Order, so we match via paymentId
        // if the payment was at least attempted.
        let failedOrder = null;
        if (razorpayPaymentId) {
          failedOrder = await Order.findOneAndUpdate(
            { paymentId: razorpayPaymentId },
            { paymentStatus: "failed" },
            { new: true },
          );
        }

        if (failedOrder) {
          await notify(null, {
            userId: failedOrder.userId,
            title: "Payment Failed ⚠️",
            message: `Your payment for order #${failedOrder._id.toString().slice(-6).toUpperCase()} failed. ${reason ? `Reason: ${reason}.` : ""} Please try again.`,
            type: "payment",
            refId: failedOrder._id,
            refModel: "Order",
          });
          console.log(
            `[Webhook] Notified user ${failedOrder.userId} of payment failure`,
          );
        } else {
          console.warn(
            `[Webhook] payment.failed — could not find matching order for payment ${razorpayPaymentId}`,
          );
        }
        break;
      }

      // ── refund.processed ─────────────────────────────────────
      // FIX: now also notifies the user that their refund landed
      case "refund.processed": {
        const refundId = entity?.id;
        const paymentId = entity?.payment_id;
        const amount = entity?.amount ? entity.amount / 100 : null; // paise → ₹

        if (refundId && paymentId) {
          const updated = await Order.findOneAndUpdate(
            { paymentId },
            { refundStatus: "refunded" },
            { new: true },
          );

          if (updated) {
            console.log(
              `[Webhook] refund.processed → order ${updated._id} refund confirmed`,
            );

            await notify(null, {
              userId: updated.userId,
              title: "Refund Processed 💰",
              message: amount
                ? `Your refund of ₹${amount.toFixed(0)} for order #${updated._id.toString().slice(-6).toUpperCase()} has been processed and will reflect in 3–5 business days.`
                : `Your refund for order #${updated._id.toString().slice(-6).toUpperCase()} has been processed.`,
              type: "payment",
              refId: updated._id,
              refModel: "Order",
            });
          }
        }
        break;
      }

      // ── order.paid ───────────────────────────────────────────
      case "order.paid": {
        const rpOrderId = entity?.id;
        console.log(`[Webhook] order.paid → razorpay order ${rpOrderId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Webhook] Handler error:", err.message);
    res.status(200).json({ received: true, error: err.message });
  }
});

export default r;
