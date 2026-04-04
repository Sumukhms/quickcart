/**
 * ratingController.js  — UPDATED
 *
 * Added:
 *   submitDeliveryRating  — POST /api/ratings/delivery
 *   Rates the delivery partner (User with role="delivery") after an order is delivered.
 *   - Verifies order belongs to the requesting customer
 *   - Verifies order is delivered
 *   - Prevents double-rating per order
 *   - Recomputes agent's average rating on User document
 *
 * Unchanged:
 *   submitRating — store rating (existing)
 */
import Rating from "../models/Rating.js";
import Store  from "../models/Store.js";
import Order  from "../models/Order.js";
import User   from "../models/User.js";

/**
 * POST /api/ratings/rate
 * Body: { storeId, rating (1-5), orderId? }
 */
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
      if (!order)                                     return res.status(404).json({ message: "Order not found" });
      if (order.userId.toString() !== userId)         return res.status(403).json({ message: "Not your order" });
      if (order.status !== "delivered")               return res.status(400).json({ message: "You can only rate after delivery" });
      const existing = await Rating.findOne({ userId, orderId });
      if (existing)                                   return res.status(400).json({ message: "You have already rated this order" });
    }

    const newRating = await Rating.create({
      userId,
      storeId,
      orderId: orderId || undefined,
      rating:  parsedRating,
    });

    const allRatings  = await Rating.find({ storeId });
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

/**
 * POST /api/ratings/delivery
 * Body: { orderId, rating (1-5) }
 *
 * Rates the delivery agent assigned to an order.
 * One rating per order per customer.
 */
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

    // Prevent double-rating — use a synthetic storeId = "delivery_<agentId>" to reuse Rating model
    const agentId     = order.deliveryAgentId.toString();
    const syntheticId = `delivery_${agentId}`;

    const existing = await Rating.findOne({ userId, orderId });
    if (existing)
      return res.status(400).json({ message: "You have already rated this delivery" });

    await Rating.create({
      userId,
      storeId:  syntheticId,   // abuse storeId field; frontend won't query this
      orderId,
      rating:   parsedRating,
    });

    // Recompute delivery agent's average rating
    const agentOrders = await Order.find({ deliveryAgentId: agentId, status: "delivered" }).select("_id");
    const agentOrderIds = agentOrders.map((o) => o._id);

    const agentRatings = await Rating.find({ orderId: { $in: agentOrderIds } });
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
      message:       "Delivery rated successfully",
      agentRating:   Math.round(avgAgentRating * 10) / 10,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: "You have already rated this delivery" });
    res.status(500).json({ message: err.message });
  }
};