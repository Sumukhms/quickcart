/**
 * ratingController.js
 *
 * submitRating         — POST /api/ratings/rate        (rate a store)
 * submitDeliveryRating — POST /api/ratings/delivery    (rate a delivery partner)
 *
 * Fix: submitDeliveryRating was passing the synthetic string "delivery_<agentId>"
 * as the Rating.storeId field, which is typed as ObjectId — causing a Mongoose
 * CastError at runtime. The delivery rating now stores agentId in storeId
 * (reusing the field), but only after converting to a proper ObjectId so
 * Mongoose is satisfied. The agentId IS a valid ObjectId (it's a User._id).
 *
 * The "abuse" of storeId to hold an agent ID is intentional to avoid
 * a schema migration; the synthetic string approach was the bug.
 */
import Rating from "../models/Rating.js";
import Store  from "../models/Store.js";
import Order  from "../models/Order.js";
import User   from "../models/User.js";

// ── POST /api/ratings/rate ────────────────────────────────────
export const submitRating = async (req, res) => {
  try {
    const { storeId, rating, orderId } = req.body;
    const userId = req.user.userId;

    if (!storeId) return res.status(400).json({ message: "storeId is required" });

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order)                             return res.status(404).json({ message: "Order not found" });
      if (order.userId.toString() !== userId) return res.status(403).json({ message: "Not your order" });
      if (order.status !== "delivered")       return res.status(400).json({ message: "You can only rate after delivery" });

      const existing = await Rating.findOne({ userId, orderId });
      if (existing) return res.status(400).json({ message: "You have already rated this order" });
    }

    const newRating = await Rating.create({
      userId,
      storeId,
      orderId: orderId || undefined,
      rating:  parsedRating,
    });

    const allRatings   = await Rating.find({ storeId });
    const totalRatings = allRatings.length;
    const avgRating    = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    await Store.findByIdAndUpdate(storeId, {
      rating:       Math.round(avgRating * 10) / 10,
      totalRatings,
    });

    res.status(201).json({
      message:     "Rating submitted successfully",
      rating:      newRating,
      storeRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "You have already rated this order" });
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/ratings/delivery ────────────────────────────────
export const submitDeliveryRating = async (req, res) => {
  try {
    const { orderId, rating } = req.body;
    const userId = req.user.userId;

    if (!orderId) return res.status(400).json({ message: "orderId is required" });

    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    const order = await Order.findById(orderId);
    if (!order)                               return res.status(404).json({ message: "Order not found" });
    if (order.userId.toString() !== userId)   return res.status(403).json({ message: "Not your order" });
    if (order.status !== "delivered")         return res.status(400).json({ message: "You can only rate after delivery" });
    if (!order.deliveryAgentId)               return res.status(400).json({ message: "No delivery agent assigned to this order" });

    // Prevent double-rating for the same order
    const existing = await Rating.findOne({ userId, orderId });
    if (existing) return res.status(400).json({ message: "You have already rated this delivery" });

    const agentId = order.deliveryAgentId; // already an ObjectId — use it directly as storeId
    // We reuse the storeId field to store the agentId (both are ObjectId).
    // This avoids a schema change while keeping Mongoose happy with the type.
    await Rating.create({
      userId,
      storeId: agentId,
      orderId,
      rating:  parsedRating,
    });

    // Recompute delivery agent's average rating across all their delivered orders
    const agentOrders    = await Order.find({ deliveryAgentId: agentId, status: "delivered" }).select("_id");
    const agentOrderIds  = agentOrders.map((o) => o._id);
    const agentRatings   = await Rating.find({ orderId: { $in: agentOrderIds } });
    const totalDeliveries = agentOrders.length;
    const avgAgentRating  =
      agentRatings.length > 0
        ? agentRatings.reduce((s, r) => s + r.rating, 0) / agentRatings.length
        : parsedRating;

    await User.findByIdAndUpdate(agentId, {
      rating:          Math.round(avgAgentRating * 10) / 10,
      totalDeliveries,
    });

    res.status(201).json({
      message:     "Delivery rated successfully",
      agentRating: Math.round(avgAgentRating * 10) / 10,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "You have already rated this delivery" });
    res.status(500).json({ message: err.message });
  }
};