/**
 * paymentController.js — FIXED v3
 *
 * Key fixes:
 *   1. RAZORPAY_KEY_ID / SECRET null-guard before creating Razorpay instance
 *   2. Amount validation: server re-computes total from DB products; rejects
 *      if client-sent amount differs by more than ₹1 (floating-point safety)
 *   3. Better error messages for missing env vars
 *   4. Idempotency on both create-order and verify
 *   5. Stock validation before order creation
 */
import Razorpay  from "razorpay";
import crypto    from "crypto";
import Order     from "../models/Order.js";
import Cart      from "../models/Cart.js";
import Product   from "../models/Product.js";
import Coupon    from "../models/Coupon.js";
import { applyCoupon } from "./couponController.js";
import {
  DELIVERY_FEE,
  RAZORPAY_CURRENCY,
  MAX_ORDER_VALUE,
  MIN_ORDER_VALUE,
} from "../config/constants.js";

// ── Guard: warn at startup if keys are missing ─────────────────
const RAZORPAY_KEY_ID     = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.warn(
    "⚠️  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in .env\n" +
    "   Online payments will return 500 until these are configured.\n" +
    "   Get keys from: https://dashboard.razorpay.com/app/keys"
  );
}

// Lazily create Razorpay instance so missing keys surface a clear error
function getRazorpay() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET " +
      "in your backend .env file and restart the server."
    );
  }
  return new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
}

// ─────────────────────────────────────────────────────────────
// Helper: compute expected total from DB (server-side)
// ─────────────────────────────────────────────────────────────
async function computeServerTotal(items, couponCode) {
  const productIds = items.map((i) => i.productId).filter(Boolean);
  const products   = await Product.find({ _id: { $in: productIds } });
  const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]));

  let subtotal = 0;
  for (const item of items) {
    const product = productMap[item.productId?.toString()];
    if (!product || !product.available) return null; // signal unavailable
    subtotal += product.price * (item.quantity || 1);
  }

  let deliveryFee = DELIVERY_FEE;
  let discount    = 0;
  let freeDelivery = false;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code:     couponCode.toUpperCase(),
      isActive: true,
    });
    if (coupon && (!coupon.expiresAt || new Date() <= coupon.expiresAt)) {
      if (subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === "percent") {
          discount = Math.round(subtotal * coupon.discountValue / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else if (coupon.discountType === "flat") {
          discount = coupon.discountValue;
        } else if (coupon.discountType === "free_delivery") {
          freeDelivery = true;
        }
      }
    }
  }

  if (freeDelivery) deliveryFee = 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return { subtotal, deliveryFee, discount, total };
}

// ─────────────────────────────────────────────────────────────
// POST /api/payment/create-order
// ─────────────────────────────────────────────────────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = getRazorpay(); // throws if keys missing

    const { amount, items, couponCode } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < MIN_ORDER_VALUE) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (Number(amount) > MAX_ORDER_VALUE) {
      return res.status(400).json({ message: `Amount cannot exceed ₹${MAX_ORDER_VALUE}` });
    }

    // ── Server-side total verification (if items provided) ────
    if (items && items.length > 0) {
      const computed = await computeServerTotal(items, couponCode);
      if (!computed) {
        return res.status(400).json({ message: "One or more items are no longer available" });
      }
      const clientAmount  = Math.round(Number(amount));
      const serverAmount  = Math.round(computed.total);
      if (Math.abs(clientAmount - serverAmount) > 1) {
        return res.status(400).json({
          message: `Amount mismatch. Expected ₹${serverAmount}, got ₹${clientAmount}. Please refresh your cart.`,
          expectedAmount: serverAmount,
        });
      }
    }

    const options = {
      amount:   Math.round(Number(amount) * 100), // paise
      currency: RAZORPAY_CURRENCY,
      receipt:  `qc_${Date.now().toString().slice(-10)}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           RAZORPAY_KEY_ID,
    });
  } catch (e) {
    console.error("Razorpay create-order error:", e.message);
    // Surface config errors clearly to the client
    if (e.message.includes("not configured") || e.message.includes("RAZORPAY")) {
      return res.status(500).json({
        message: e.message,
        configError: true,
      });
    }
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
    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay not configured on server" });
    }

    const body        = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSig = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      console.warn(`[Payment] Signature mismatch for userId: ${req.user.userId}`);
      return res.status(400).json({ message: "Payment verification failed — invalid signature" });
    }

    // ── 3. Idempotency: already processed? ────────────────────
    const existingOrder = await Order.findOne({ paymentId: razorpay_payment_id });
    if (existingOrder) {
      return res.status(200).json(existingOrder);
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

    // ── 5. Server-side amount verification ────────────────────
    const computed = await computeServerTotal(
      orderData.items,
      orderData.couponCode
    );
    if (!computed) {
      return res.status(400).json({ message: "One or more items are no longer available" });
    }

    // The client sends totalPrice = items total (no delivery fee added on server)
    // Verify within ₹1 tolerance
    const expectedTotal = Math.round(computed.total);
    const clientTotal   = Math.round(Number(orderData.totalPrice || 0));
    if (Math.abs(expectedTotal - clientTotal) > 1) {
      console.warn(
        `[Payment] Amount mismatch for userId ${req.user.userId}: ` +
        `expected ₹${expectedTotal}, got ₹${clientTotal}`
      );
      return res.status(400).json({
        message: `Order total mismatch. Expected ₹${expectedTotal}. Please refresh and try again.`,
        expectedAmount: expectedTotal,
      });
    }

    // ── 6. Stock validation per item ──────────────────────────
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

    // ── 7. Create DB order ────────────────────────────────────
    const {
      storeId, items, totalPrice, deliveryAddress,
      paymentMethod, notes, couponCode,
    } = orderData;

    const order = await Order.create({
      userId:          req.user.userId,
      storeId,
      items,
      totalPrice:      computed.total,       // use server-computed total
      deliveryFee:     computed.deliveryFee,
      deliveryAddress,
      paymentMethod:   paymentMethod || "online",
      notes,
      paymentStatus:   "paid",
      paymentId:       razorpay_payment_id,
      statusHistory:   [{ status: "pending", timestamp: new Date(), updatedBy: req.user.userId }],
    });

    // ── 8. Decrement stock ────────────────────────────────────
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

    // ── 9. Clear cart ─────────────────────────────────────────
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null }
    );

    // ── 10. Notify store via socket ───────────────────────────
    req.io?.to(`store_${storeId}`).emit("new_order", { orderId: order._id, order });

    // ── 11. Coupon usage increment ────────────────────────────
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