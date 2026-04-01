import Coupon from "../models/Coupon.js";

export const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, storeCategory, storeId } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code required" });

    // Look for coupon that is either platform-wide or belongs to this specific store
    const query = {
      code:     code.toUpperCase(),
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
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }
    if (orderTotal < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order ₹${coupon.minOrderAmount} required` });
    }
    if (coupon.applicableCategories.length > 0 && storeCategory &&
        !coupon.applicableCategories.includes(storeCategory)) {
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
      }
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const applyCoupon = async (couponCode) => {
  await Coupon.findOneAndUpdate({ code: couponCode }, { $inc: { usedCount: 1 } });
};

export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const listCoupons = async (req, res) => {
  try {
    // Only return platform-wide coupons on the public endpoint
    const coupons = await Coupon.find({
      $or: [{ storeId: null }, { storeId: { $exists: false } }]
    }).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (e) { res.status(500).json({ message: e.message }); }
};