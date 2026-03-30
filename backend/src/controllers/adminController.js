import User   from "../models/User.js";
import Order  from "../models/Order.js";
import Store  from "../models/Store.js";
import Coupon from "../models/Coupon.js";

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

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
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