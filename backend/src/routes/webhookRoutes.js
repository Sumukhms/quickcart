/**
 * webhookRoutes.js
 *
 * Mount BEFORE body-parsing middleware in server.js so that
 * raw body is available for HMAC-SHA256 signature verification:
 *
 *   import webhookRoutes from "./src/routes/webhookRoutes.js";
 *   app.use("/api/webhook", webhookRoutes);   // ← before express.json()
 *
 * Razorpay dashboard → Settings → Webhooks:
 *   URL:    https://yourdomain.com/api/webhook/razorpay
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET in .env
 *   Events to enable:
 *     - payment.captured
 *     - payment.failed
 *     - refund.processed
 *     - order.paid
 */
import express    from "express";
import crypto     from "crypto";
import Order      from "../models/Order.js";
import Product    from "../models/Product.js";

const r = express.Router();
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// ── Raw body parser for this route only ──────────────────────
// We need the raw body bytes to verify the X-Razorpay-Signature header.
r.use(express.raw({ type: "application/json" }));

// ── POST /api/webhook/razorpay ────────────────────────────────
r.post("/razorpay", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];

  // ── 1. Verify signature ───────────────────────────────────
  if (!WEBHOOK_SECRET) {
    console.warn("[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature check (unsafe!)");
  } else {
    if (!signature) {
      console.warn("[Webhook] Missing X-Razorpay-Signature header");
      return res.status(400).json({ message: "Missing signature" });
    }
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(req.body)          // raw Buffer
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      console.warn("[Webhook] Signature mismatch — ignoring event");
      return res.status(400).json({ message: "Invalid signature" });
    }
  }

  // ── 2. Parse payload ──────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  const event   = payload.event;
  const entity  = payload.payload?.payment?.entity
                || payload.payload?.refund?.entity
                || payload.payload?.order?.entity;

  console.log(`[Webhook] Event received: ${event}`);

  try {
    // ── 3. Route events ────────────────────────────────────
    switch (event) {

      // ── payment.captured ─────────────────────────────────
      // Fires when payment is successfully captured.
      // We've already created the Order in verifyPaymentAndCreateOrder,
      // but this is a safety net to confirm payment status.
      case "payment.captured": {
        const paymentId = entity?.id;
        if (paymentId) {
          const updated = await Order.findOneAndUpdate(
            { paymentId },
            { paymentStatus: "paid" }
          );
          if (updated) {
            console.log(`[Webhook] payment.captured → order ${updated._id} marked paid`);
          }
        }
        break;
      }

      // ── payment.failed ────────────────────────────────────
      // Payment attempt failed (wrong OTP, insufficient funds, etc.)
      // We don't create an order on failure, but we can log/alert.
      case "payment.failed": {
        const failureReason = entity?.error_description || "Unknown";
        const razorpayOrderId = entity?.order_id;
        console.warn(
          `[Webhook] payment.failed — razorpay_order_id: ${razorpayOrderId}, reason: ${failureReason}`
        );
        // Optionally: find a "pending" order with this razorpay order_id and update it
        // For now we log and return 200 so Razorpay won't retry endlessly.
        break;
      }

      // ── refund.processed ─────────────────────────────────
      case "refund.processed": {
        const refundId  = entity?.id;
        const paymentId = entity?.payment_id;
        if (refundId && paymentId) {
          const updated = await Order.findOneAndUpdate(
            { paymentId },
            { refundStatus: "refunded" }
          );
          if (updated) {
            console.log(`[Webhook] refund.processed → order ${updated._id} refund confirmed`);
          }
        }
        break;
      }

      // ── order.paid ────────────────────────────────────────
      // Alternative to payment.captured — fires when a Razorpay Order
      // transitions to "paid" state.
      case "order.paid": {
        const rpOrderId = entity?.id;
        console.log(`[Webhook] order.paid → razorpay order ${rpOrderId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    // ── 4. Always return 200 to acknowledge receipt ────────
    // Razorpay retries events up to 4 times if it doesn't receive 200.
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("[Webhook] Handler error:", err.message);
    // Still return 200 so Razorpay doesn't retry a broken handler in a loop.
    res.status(200).json({ received: true, error: err.message });
  }
});

export default r;