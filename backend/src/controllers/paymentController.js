/**
 * paymentController.js
 *
 * Two endpoints:
 *   POST /api/payment/create-order  — creates a Razorpay payment order
 *   POST /api/payment/verify        — verifies signature, then creates the DB order
 *
 * The DB order is NEVER created before payment is verified.
 * After verification the existing order-creation logic is reused directly,
 * so cart-clearing, socket events, coupon usage, etc. all still work.
 */
import Razorpay  from "razorpay";
import crypto    from "crypto";
import Order     from "../models/Order.js";
import Cart      from "../models/Cart.js";
import { applyCoupon } from "./couponController.js";

// ── Razorpay instance ────────────────────────────────────────
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// POST /api/payment/create-order
//
// Body: { amount }   (in rupees — we convert to paise here)
//
// Returns: { razorpayOrderId, amount, currency, keyId }
// ─────────────────────────────────────────────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const options = {
  amount: Math.round(Number(amount) * 100),
  currency: "INR",
  receipt: `qc_${Date.now()}`, // ✅ FIXED
};

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("Razorpay create-order error:", e);
    res.status(500).json({ message: e.message || "Failed to create payment order" });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/payment/verify
//
// Body:
//   razorpay_payment_id  — from Razorpay handler.response
//   razorpay_order_id    — from Razorpay handler.response
//   razorpay_signature   — from Razorpay handler.response
//   orderData            — the same payload you'd pass to placeOrder
//     { storeId, items, totalPrice, deliveryAddress, paymentMethod,
//       notes?, couponCode? }
//
// On success: creates DB order with paymentStatus:"paid", returns order.
// On failure: 400.
// ─────────────────────────────────────────────────────────────
export const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = req.body;

    // ── 1. Validate required fields ────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment details" });
    }
    if (!orderData?.storeId || !orderData?.items?.length || !orderData?.deliveryAddress) {
      return res.status(400).json({ message: "Missing order data" });
    }

    // ── 2. Verify HMAC-SHA256 signature ────────────────────
    const body          = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig   = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed — invalid signature" });
    }

    // ── 3. Create the DB order (reusing existing logic) ────
    const {
      storeId,
      items,
      totalPrice,
      deliveryAddress,
      paymentMethod,
      notes,
      couponCode,
    } = orderData;

    const order = await Order.create({
      userId:          req.user.userId,
      storeId,
      items,
      totalPrice,
      deliveryAddress,
      paymentMethod:   paymentMethod || "online",
      notes,
      paymentStatus:   "paid",
      paymentId:       razorpay_payment_id,
      statusHistory:   [{ status: "pending", timestamp: new Date(), updatedBy: req.user.userId }],
    });

    // ── 4. Clear cart ───────────────────────────────────────
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null }
    );

    // ── 5. Notify store via socket ──────────────────────────
    req.io?.to(`store_${storeId}`).emit("new_order", { orderId: order._id, order });

    // ── 6. Increment coupon usage ───────────────────────────
    if (couponCode?.trim()) {
      try { await applyCoupon(couponCode.trim().toUpperCase()); }
      catch (e) { console.warn("Coupon usage increment failed:", e.message); }
    }

    res.status(201).json(order);
  } catch (e) {
    console.error("Payment verify error:", e);
    res.status(500).json({ message: e.message || "Server error during payment verification" });
  }
};