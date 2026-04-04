import User   from "../models/User.js";
import Order  from "../models/Order.js";
import Store  from "../models/Store.js";
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
      users:   userCount,
      orders:  orderCount,
      stores:  storeCount,
      revenue: revenue[0]?.total || 0,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getUsers = async (req, res) => {
  try {
    const { role, limit = 50, skip = 0, search } = req.query;
    const filter = {};
    if (role)   filter.role = role;
    if (search) filter.name = { $regex: search, $options: "i" };
    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).limit(Number(limit)).skip(Number(skip)),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, limit = 50, skip = 0 } = req.query;
    const filter = status ? { status } : {};
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId",  "name email phone")
        .populate("storeId", "name category")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Coupons ────────────────────────────────────────────────────
export const createCoupon = async (req, res) => {
  try {
    // Admin coupons have no storeId (platform-wide)
    const coupon = await Coupon.create({ ...req.body, storeId: null });
    res.status(201).json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const listCoupons = async (req, res) => {
  try {
    // Admin sees ALL coupons (platform + store-specific)
    const coupons = await Coupon.find()
      .populate("storeId", "name")
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: "Coupon deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── Banners ────────────────────────────────────────────────────
export const listBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    res.json(banners);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const createBanner = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    res.json(banner);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: "Banner deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });
    banner.isActive = !banner.isActive;
    await banner.save();
    res.json(banner);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── GET /api/admin/payouts ─────────────────────────────────────
export const getPendingPayouts = async (req, res) => {
  try {
    const { status = "pending", limit = 50, skip = 0 } = req.query;
    const filter = status === "all" ? {} : { status };

    const [requests, total] = await Promise.all([
      PayoutRequest.find(filter)
        .populate("deliveryPartnerId", "name email phone vehicleType rating totalDeliveries")
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip)),
      PayoutRequest.countDocuments(filter),
    ]);

    res.json({ requests, total });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ── PATCH /api/admin/payout/:id ────────────────────────────────
export const processPayout = async (req, res) => {
  try {
    const { action, note = "" } = req.body; // action: "approved" | "rejected"

    if (!["approved", "rejected"].includes(action)) {
      return res.status(400).json({ message: "action must be 'approved' or 'rejected'" });
    }

    const request = await PayoutRequest.findById(req.params.id)
      .populate("deliveryPartnerId", "name email");

    if (!request) {
      return res.status(404).json({ message: "Payout request not found" });
    }

    // Prevent double-processing
    if (request.status !== "pending") {
      return res.status(400).json({
        message: `This request has already been ${request.status}. No changes made.`,
        currentStatus: request.status,
      });
    }

    request.status      = action;
    request.processedAt = new Date();
    request.note        = note.trim();
    await request.save();

    res.json({
      message: `Payout ${action} successfully.`,
      request,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};