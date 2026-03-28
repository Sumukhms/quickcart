import Rating from "../models/Rating.js";
import Store from "../models/Store.js";
import Order from "../models/Order.js";

/**
 * POST /api/ratings/rate
 * Body: { storeId, rating (1-5), orderId? }
 *
 * - Only allowed after order is "delivered"
 * - Prevents double submission per order
 * - Updates store.rating (running average) and store.totalRatings
 */
export const submitRating = async (req, res) => {
  try {
    const { storeId, rating, orderId } = req.body;
    const userId = req.user.userId;

    // ── Validate input ─────────────────────────────────────
    if (!storeId) {
      return res.status(400).json({ message: "storeId is required" });
    }
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // ── If orderId provided, verify the order is delivered
    //    and belongs to this user ──────────────────────────
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (order.userId.toString() !== userId) {
        return res.status(403).json({ message: "Not your order" });
      }
      if (order.status !== "delivered") {
        return res.status(400).json({ message: "You can only rate after delivery" });
      }
      // Guard: already rated this order?
      const existing = await Rating.findOne({ userId, orderId });
      if (existing) {
        return res.status(400).json({ message: "You have already rated this order" });
      }
    }

    // ── Save the rating ────────────────────────────────────
    const newRating = await Rating.create({
      userId,
      storeId,
      orderId: orderId || undefined,
      rating: parsedRating,
    });

    // ── Recompute store average and update atomically ──────
    // Recalculate from all ratings for accuracy
    const allRatings = await Rating.find({ storeId });
    const totalRatings = allRatings.length;
    const avgRating =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    await Store.findByIdAndUpdate(storeId, {
      rating: Math.round(avgRating * 10) / 10, // round to 1 decimal
      totalRatings,
    });

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: newRating,
      storeRating: Math.round(avgRating * 10) / 10,
    });
  } catch (err) {
    // Duplicate key error (unique index on userId+orderId)
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already rated this order" });
    }
    res.status(500).json({ message: err.message });
  }
};