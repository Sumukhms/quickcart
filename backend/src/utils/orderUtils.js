import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { DELIVERY_FEE } from "../config/constants.js";

/**
 * Compute expected order total server-side from DB prices
 * Returns: { subtotal, deliveryFee, discount, total }
 * or null if any item is unavailable
 */
export async function computeServerTotal(items, couponCode) {
  const productIds = items.map((i) => i.productId).filter(Boolean);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = Object.fromEntries(
    products.map((p) => [p._id.toString(), p]),
  );

  let subtotal = 0;
  for (const item of items) {
    const product = productMap[item.productId?.toString()];
    if (!product || !product.available) return null;
    subtotal += product.price * (item.quantity || 1);
  }

  let deliveryFee = DELIVERY_FEE;
  let discount = 0;
  let freeDelivery = false;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (coupon && (!coupon.expiresAt || new Date() <= coupon.expiresAt)) {
      if (subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === "percent") {
          discount = Math.round((subtotal * coupon.discountValue) / 100);
          if (coupon.maxDiscount)
            discount = Math.min(discount, coupon.maxDiscount);
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
