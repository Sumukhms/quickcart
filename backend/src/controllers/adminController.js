import Razorpay from "razorpay";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Store from "../models/Store.js";
import Coupon from "../models/Coupon.js";
import Banner from "../models/Banner.js";
import PayoutRequest from "../models/PayoutRequest.js";

export const getStats = async (req, res) => {
  try {
    const [userCount, orderCount, storeCount, revenue] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Store.countDocuments(),
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);
    res.json({
      users: userCount,
      orders: orderCount,
      stores: storeCount,
      revenue: revenue[0]?.total || 0,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, limit = 50, skip = 0, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.name = { $regex: search, $options: "i" };
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip)),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email phone")
        .populate("storeId", "name category")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── Coupons ────────────────────────────────────────────────────
export const createCoupon = async (req, res) => {
  try {
    // Admin coupons have no storeId (platform-wide)
    const coupon = await Coupon.create({ ...req.body, storeId: null });
    res.status(201).json(coupon);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const listCoupons = async (req, res) => {
  try {
    // Admin sees ALL coupons (platform + store-specific)
    const coupons = await Coupon.find()
      .populate("storeId", "name")
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── Banners ────────────────────────────────────────────────────
export const listBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json(banner);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json(banner);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay not configured");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// ── GET /api/admin/refunds ─────────────────────────────────────
export const getPendingRefunds = async (req, res) => {
  try {
    const { status = "pending", limit = 50, skip = 0 } = req.query;
    const filter = {};

    if (status === "all") {
      filter.refundStatus = {
        $in: ["pending", "refunded", "manual_pending", "failed"],
      };
    } else if (status === "pending") {
      filter.refundStatus = { $in: ["pending", "manual_pending"] };
    } else {
      filter.refundStatus = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email phone")
        .populate("storeId", "name")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip))
        .select(
          "_id userId storeId totalPrice refundStatus refundAmount refundReason refundId paymentId paymentMethod createdAt items",
        ),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── POST /api/admin/refunds/:orderId/process ──────────────────
export const processRefund = async (req, res) => {
  try {
    const { action, amount, reason = "admin_approved" } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: "action must be 'approve' or 'reject'" });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["pending", "manual_pending"].includes(order.refundStatus)) {
      return res.status(400).json({
        message: `Cannot process — refundStatus is "${order.refundStatus}"`,
      });
    }

    if (action === "reject") {
      await Order.findByIdAndUpdate(order._id, {
        refundStatus: "failed",
        refundReason: reason,
      });
      return res.json({ message: "Refund rejected.", refundStatus: "failed" });
    }

    if (order.paymentMethod === "cod" || !order.paymentId) {
      await Order.findByIdAndUpdate(order._id, {
        refundStatus: "refunded",
        refundAmount: amount ?? order.totalPrice,
        refundReason: reason,
        refundInitiatedAt: new Date(),
      });
      return res.json({
        message: "COD refund marked as processed. Handle cash manually.",
        refundStatus: "refunded",
      });
    }

    const razorpay = getRazorpay();
    const refundAmountPaise = Math.round((amount ?? order.totalPrice) * 100);

    const refundResult = await razorpay.payments.refund(order.paymentId, {
      amount: refundAmountPaise,
      speed: "normal",
      notes: { orderId: order._id.toString(), reason, adminProcessed: true },
    });

    await Order.findByIdAndUpdate(order._id, {
      refundId: refundResult.id,
      refundStatus: "pending",
      refundAmount: refundAmountPaise / 100,
      refundReason: reason,
      refundInitiatedAt: new Date(),
    });

    res.json({
      message: "Refund initiated via Razorpay. Will process in 5–7 days.",
      refundId: refundResult.id,
      refundStatus: "pending",
      amount: refundAmountPaise / 100,
    });
  } catch (e) {
    console.error("[AdminRefund] error:", e.message);
    if (e.error?.description) {
      return res.status(400).json({ message: e.error.description });
    }
    res.status(500).json({ message: e.message });
  }
};

// ── GET /api/admin/payouts ─────────────────────────────────────
export const getPendingPayouts = async (req, res) => {
  try {
    const { status = "pending", limit = 50, skip = 0 } = req.query;
    const filter = status === "all" ? {} : { status };

    const [requests, total] = await Promise.all([
      PayoutRequest.find(filter)
        .populate(
          "deliveryPartnerId",
          "name email phone vehicleType rating totalDeliveries",
        )
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip)),
      PayoutRequest.countDocuments(filter),
    ]);

    res.json({ requests, total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── PATCH /api/admin/payout/:id ────────────────────────────────
export const processPayout = async (req, res) => {
  try {
    const { action, note = "" } = req.body;
 
    // ✅ FIX: "processed" matches PayoutRequest enum, NOT "approved"
    if (!["processed", "rejected"].includes(action)) {
      return res.status(400).json({
        message: "action must be 'processed' or 'rejected'",
      });
    }
 
    const request = await PayoutRequest.findById(req.params.id).populate(
      "deliveryPartnerId",
      "name email",
    );
 
    if (!request) {
      return res.status(404).json({ message: "Payout request not found" });
    }
 
    // ✅ FIX: Prevent double-processing
    if (request.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been ${request.status}. No changes made.`,
        currentStatus: request.status,
      });
    }
 
    request.status      = action;         // "processed" or "rejected"
    request.processedAt = new Date();
    request.note        = note.trim();
    await request.save();
 
    console.log(
      `[Admin] Payout ${action} for partner ${request.deliveryPartnerId?.name} — ₹${request.amount}`,
    );
 
    res.json({
      message: `Payout ${action} successfully.`,
      request,
    });
  } catch (e) {
    console.error("[Admin] processPayout error:", e.message);
    res.status(500).json({ message: e.message });
  }
};