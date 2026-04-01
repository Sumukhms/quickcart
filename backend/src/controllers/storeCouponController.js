/**
 * storeCouponController.js
 *
 * Store owners can create, list, toggle, and delete coupons
 * that apply specifically to their store.
 *
 * Routes (mounted at /api/store-coupons):
 *   GET    /           — list this store's coupons
 *   POST   /           — create coupon for this store
 *   PATCH  /:id/toggle — toggle active/inactive
 *   DELETE /:id        — delete coupon
 *
 * Admin coupons (no storeId) apply to ALL stores.
 * Store coupons (storeId set) apply only when ordering from that store.
 */
import Coupon from "../models/Coupon.js";
import Store  from "../models/Store.js";

// ── Helper: get store owned by current user ────────────────────
async function getOwnedStore(userId) {
  const store = await Store.findOne({ ownerId: userId });
  if (!store) throw Object.assign(new Error("No store found for this account"), { status: 404 });
  return store;
}

// ── GET /api/store-coupons ─────────────────────────────────────
export const listStoreCoupons = async (req, res) => {
  try {
    const store   = await getOwnedStore(req.user.userId);
    const coupons = await Coupon.find({ storeId: store._id }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── POST /api/store-coupons ────────────────────────────────────
export const createStoreCoupon = async (req, res) => {
  try {
    const store = await getOwnedStore(req.user.userId);

    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxDiscount, usageLimit, expiresAt,
    } = req.body;

    if (!code?.trim()) return res.status(400).json({ message: "Coupon code is required" });
    if (!discountType) return res.status(400).json({ message: "Discount type is required" });

    // Check for duplicate code across all coupons
    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) return res.status(400).json({ message: "Coupon code already exists" });

    const coupon = await Coupon.create({
      code:             code.trim().toUpperCase(),
      description:      description || "",
      discountType,
      discountValue:    Number(discountValue) || 0,
      minOrderAmount:   Number(minOrderAmount) || 0,
      maxDiscount:      maxDiscount ? Number(maxDiscount) : null,
      usageLimit:       usageLimit  ? Number(usageLimit)  : null,
      expiresAt:        expiresAt   ? new Date(expiresAt) : null,
      isActive:         true,
      storeId:          store._id,          // ← ties coupon to this store
      applicableCategories: [],
    });

    res.status(201).json(coupon);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── PATCH /api/store-coupons/:id/toggle ───────────────────────
export const toggleStoreCoupon = async (req, res) => {
  try {
    const store  = await getOwnedStore(req.user.userId);
    const coupon = await Coupon.findOne({ _id: req.params.id, storeId: store._id });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── DELETE /api/store-coupons/:id ─────────────────────────────
export const deleteStoreCoupon = async (req, res) => {
  try {
    const store  = await getOwnedStore(req.user.userId);
    const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, storeId: store._id });
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};