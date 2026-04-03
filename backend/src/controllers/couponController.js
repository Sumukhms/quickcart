/**
 * couponController.js — FIXED
 *
 * Bug fix: coupons now enforce per-user limits.
 *
 * validateCoupon — now accepts optional `userId` to check per-user uses.
 * applyCoupon    — atomically increments global usedCount AND records
 *                  the userId in the usages array, checking both limits.
 */
import Coupon from "../models/Coupon.js";

// ─────────────────────────────────────────────────────────────
// Helper: count how many times a user has used a coupon
// ─────────────────────────────────────────────────────────────
function userUseCount(coupon, userId) {
  if (!userId || !coupon.usages?.length) return 0;
  const uid = userId.toString();
  return coupon.usages.filter((u) => u.userId?.toString() === uid).length;
}

// ─────────────────────────────────────────────────────────────
// POST /api/coupons/validate
// ─────────────────────────────────────────────────────────────
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, storeCategory, storeId } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code required" });

    // userId comes from the auth token if the user is logged in
    const userId = req.user?.userId;

    const query = {
      code:     code.toUpperCase().trim(),
      isActive: true,
      $or: [
        { storeId: null },
        { storeId: { $exists: false } },
        ...(storeId ? [{ storeId }] : []),
      ],
    };
    const coupon = await Coupon.findOne(query);
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    // Global usage cap
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    // Per-user usage cap
    if (userId) {
      const timesUsed = userUseCount(coupon, userId);
      const perLimit  = coupon.perUserLimit ?? 1;
      if (timesUsed >= perLimit) {
        return res.status(400).json({
          message: perLimit === 1
            ? "You have already used this coupon"
            : `You can only use this coupon ${perLimit} time${perLimit > 1 ? "s" : ""}`,
        });
      }
    }

    if (orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order ₹${coupon.minOrderAmount} required` });
    }

    if (
      coupon.applicableCategories.length > 0 &&
      storeCategory &&
      !coupon.applicableCategories.includes(storeCategory)
    ) {
      return res.status(400).json({ message: "Coupon not valid for this store category" });
    }

    let discountAmount = 0;
    let freeDelivery   = false;

    if (coupon.discountType === "percent") {
      discountAmount = Math.round(orderTotal * coupon.discountValue / 100);
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else if (coupon.discountType === "flat") {
      discountAmount = coupon.discountValue;
    } else if (coupon.discountType === "free_delivery") {
      freeDelivery = true;
    }

    res.json({
      valid: true,
      coupon: {
        code:          coupon.code,
        description:   coupon.description,
        discountType:  coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        freeDelivery,
        storeSpecific: !!coupon.storeId,
      },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─────────────────────────────────────────────────────────────
// applyCoupon — called internally from orderController /
//               paymentController after the order is created.
//
// FIXED:
//   • Checks per-user limit before applying
//   • Atomically increments usedCount AND pushes to usages[]
//   • Uses findOneAndUpdate with all guards to prevent race conditions
// ─────────────────────────────────────────────────────────────
export const applyCoupon = async (couponCode, userId) => {
  if (!couponCode) return;

  const code = couponCode.toUpperCase().trim();

  // We must check per-user limit first (cannot express it as an atomic filter
  // efficiently without aggregation). Load the doc, check, then do atomic update.
  const coupon = await Coupon.findOne({ code, isActive: true });
  if (!coupon) {
    throw new Error(`Coupon ${code} not found or inactive`);
  }

  // Per-user check
  if (userId) {
    const timesUsed = userUseCount(coupon, userId);
    const perLimit  = coupon.perUserLimit ?? 1;
    if (timesUsed >= perLimit) {
      throw new Error(
        perLimit === 1
          ? `You have already used coupon ${code}`
          : `Coupon ${code} usage limit per user reached`
      );
    }
  }

  // Atomic update: increment global counter AND guard global cap
  const filter = {
    code,
    isActive: true,
    $or: [
      { usageLimit: null },
      { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
    ],
  };

  const update = {
    $inc: { usedCount: 1 },
    ...(userId ? { $push: { usages: { userId, usedAt: new Date() } } } : {}),
  };

  const result = await Coupon.findOneAndUpdate(filter, update, { new: true });

  if (!result) {
    throw new Error(`Coupon ${code} could not be applied (global limit reached or inactive)`);
  }
};

// ─────────────────────────────────────────────────────────────
// Admin / store CRUD (unchanged logic)
// ─────────────────────────────────────────────────────────────
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const listCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      $or: [{ storeId: null }, { storeId: { $exists: false } }],
    }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) { res.status(500).json({ message: e.message }); }
};