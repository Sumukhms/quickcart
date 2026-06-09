import Store from "../models/Store.js";
import Order from "../models/Order.js";
import User from "../models/User.js";

export const getHomeStats = async (_req, res) => {
  try {
    const [
      totalStores,
      totalOrders,
      totalCustomers,
      deliveredToday,
      avgRatingAgg,
    ] = await Promise.all([
      Store.countDocuments({ isOpen: true }),
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({
        status: "delivered",
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Store.aggregate([
        { $match: { totalRatings: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } },
      ]),
    ]);

    const avgRating = avgRatingAgg[0]?.avg
      ? (Math.round(avgRatingAgg[0].avg * 10) / 10).toFixed(1)
      : "4.8";

    res.json({
      totalStores,
      totalOrders,
      totalCustomers,
      deliveredToday,
      avgRating,
      features: [
        {
          key: "delivery",
          stat: "10 min",
          label: "Avg Delivery",
          emoji: "⚡",
          color: "#f59e0b",
        },
        {
          key: "safe",
          stat: "100%",
          label: "Quality Safe",
          emoji: "🛡️",
          color: "#22c55e",
        },
        {
          key: "stores",
          stat: `${totalStores}+`,
          label: "Open Stores",
          emoji: "🏪",
          color: "#3b82f6",
        },
        {
          key: "rating",
          stat: `${avgRating}★`,
          label: "Avg Store Rating",
          emoji: "⭐",
          color: "#a855f7",
        },
      ],
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
