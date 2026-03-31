import Store  from "../models/Store.js";
import Order  from "../models/Order.js";
import User   from "../models/User.js";

/**
 * GET /api/stats/home
 * Public endpoint — powers homepage banners & feature chips.
 * Cached-friendly: call with Cache-Control on the client.
 */
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
      // Derived display strings
      features: [
        { key: "delivery",  stat: "10 min",           label: "Avg Delivery",     emoji: "⚡", color: "#f59e0b" },
        { key: "safe",      stat: "100%",              label: "Quality Safe",      emoji: "🛡️", color: "#22c55e" },
        { key: "stores",    stat: `${totalStores}+`,   label: "Open Stores",      emoji: "🏪", color: "#3b82f6" },
        { key: "rating",    stat: `${avgRating}★`,     label: "Avg Store Rating", emoji: "⭐", color: "#a855f7" },
      ],
      banners: [
        {
          key:   "offer",
          title: "First Order FREE",
          sub:   "Use code QUICKFIRST at checkout",
          badge: "🎁 New user offer",
          emoji: "🎁",
          cta:   "Claim Now",
          bg:    "from-orange-600 via-red-600 to-pink-700",
          link:  "/user/home",
        },
        {
          key:   "speed",
          title: `${deliveredToday}+ Delivered Today`,
          sub:   `From ${totalStores}+ local stores near you`,
          badge: "⚡ Express",
          emoji: "🛵",
          cta:   "Order Now",
          bg:    "from-purple-700 via-violet-600 to-indigo-700",
          link:  "/user/home",
        },
        {
          key:   "fresh",
          title: "Farm Fresh Daily",
          sub:   `${totalCustomers.toLocaleString()}+ happy customers`,
          badge: "🌿 Seasonal picks",
          emoji: "🥬",
          cta:   "Shop Fresh",
          bg:    "from-teal-600 via-emerald-600 to-green-700",
          link:  "/user/home",
        },
      ],
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};