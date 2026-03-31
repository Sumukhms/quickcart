/**
 * paymentController.js — UPDATED
 *
 * Changes vs original:
 *   1. DELIVERY_FEE, RAZORPAY_CURRENCY from constants (no hardcoding)
 *   2. Same idempotency guard as placeOrder (30-second window)
 *   3. Stock decrement after verified payment
 *   4. Stock restore is handled by cancelOrder if needed
 */
import Razorpay  from "razorpay";
import crypto    from "crypto";
import Order     from "../models/Order.js";
import Cart      from "../models/Cart.js";
import Product   from "../models/Product.js";
import { applyCoupon } from "./couponController.js";
import {
  DELIVERY_FEE,
  RAZORPAY_CURRENCY,
  MAX_ORDER_VALUE,
  MIN_ORDER_VALUE,
} from "../config/constants.js";

// ── Validate env at startup ────────────────────────────────────
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — payments will fail");
}

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// ─────────────────────────────────────────────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < MIN_ORDER_VALUE) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (Number(amount) > MAX_ORDER_VALUE) {
      return res.status(400).json({ message: `Amount cannot exceed ₹${MAX_ORDER_VALUE}` });
    }

    const options = {
      amount:   Math.round(Number(amount) * 100), // paise
      currency: RAZORPAY_CURRENCY,
      receipt:  `qc_${req.user.userId}_${Date.now()}`,
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
// ─────────────────────────────────────────────────────────────
export const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = req.body;

    // ── 1. Required fields ────────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment details" });
    }
    if (!orderData?.storeId || !orderData?.items?.length || !orderData?.deliveryAddress) {
      return res.status(400).json({ message: "Missing order data" });
    }

    // ── 2. Verify HMAC-SHA256 signature ───────────────────────
    const body        = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      console.warn(`Payment signature mismatch — userId: ${req.user.userId}`);
      return res.status(400).json({ message: "Payment verification failed — invalid signature" });
    }

    // ── 3. Idempotency: prevent duplicate verified orders ─────
    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      return res.status(200).json(existingOrder); // idempotent re-response
    }

    // ── 4. Prevent duplicate pending orders ───────────────────
    const recentPending = await Order.findOne({
      userId:    req.user.userId,
      storeId:   orderData.storeId,
      status:    "pending",
      createdAt: { $gte: new Date(Date.now() - 30_000) },
    });
    if (recentPending && !recentPending.paymentId) {
      return res.status(409).json({
        message: "Duplicate order detected.",
        orderId: recentPending._id,
      });
    }

    // ── 5. Stock validation ───────────────────────────────────
    const productIds = orderData.items.map((i) => i.productId).filter(Boolean);
    const products   = await Product.find({ _id: { $in: productIds } });
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

    for (const item of orderData.items) {
      const product = productMap[item.productId?.toString()];
      if (!product || !product.available) {
        return res.status(400).json({ message: `"${item.name}" is no longer available` });
      }
      if (
        product.stock !== undefined &&
        product.stock !== null &&
        product.stock < item.quantity
      ) {
        return res.status(400).json({
          message: `Only ${product.stock} unit${product.stock !== 1 ? "s" : ""} of "${product.name}" left`,
          available: product.stock,
        });
      }
    }

    // ── 6. Create DB order ────────────────────────────────────
    const {
      storeId, items, totalPrice, deliveryAddress,
      paymentMethod, notes, couponCode,
    } = orderData;

    const order = await Order.create({
      userId:          req.user.userId,
      storeId,
      items,
      totalPrice,
      deliveryFee:     DELIVERY_FEE,
      deliveryAddress,
      paymentMethod:   paymentMethod || "online",
      notes,
      paymentStatus:   "paid",
      paymentId:       razorpay_payment_id,
      statusHistory:   [{ status: "pending", timestamp: new Date(), updatedBy: req.user.userId }],
    });

    // ── 7. Decrement stock ────────────────────────────────────
    const bulkStockOps = items
      .filter((i) => i.productId)
      .map((i) => ({
        updateOne: {
          filter: { _id: i.productId, stock: { $gte: i.quantity } },
          update: { $inc: { stock: -i.quantity } },
        },
      }));
    if (bulkStockOps.length) {
      Product.bulkWrite(bulkStockOps).catch((err) =>
        console.error("Stock decrement error:", err.message)
      );
    }

    // ── 8. Clear cart ─────────────────────────────────────────
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null }
    );

    // ── 9. Notify store ───────────────────────────────────────
    req.io?.to(`store_${storeId}`).emit("new_order", { orderId: order._id, order });

    // ── 10. Coupon usage ──────────────────────────────────────
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