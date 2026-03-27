import Coupon from "../models/Coupon.js";

export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, storeCategory } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ message: "Coupon has expired" });
    }
    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    // Check min order
    if (orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order ₹${coupon.minOrderAmount} required` });
    }
    // Check category applicability
    if (coupon.applicableCategories.length > 0 && storeCategory &&
        !coupon.applicableCategories.includes(storeCategory)) {
      return res.status(400).json({ message: "Coupon not valid for this store category" });
    }

    let discountAmount = 0;
    let freeDelivery = false;

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
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        freeDelivery,
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const applyCoupon = async (couponCode) => {
  await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
};

// Admin: create coupon
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