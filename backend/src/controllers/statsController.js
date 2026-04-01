import Store  from "../models/Store.js";
import Order  from "../models/Order.js";
import User   from "../models/User.js";
import Banner from "../models/Banner.js";

const DEFAULT_BANNERS = [
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
    title: "10 Min Delivery",
    sub:   "From local stores near you",
    badge: "⚡ Express",
    emoji: "🛵",
    cta:   "Order Now",
    bg:    "from-purple-700 via-violet-600 to-indigo-700",
    link:  "/user/home",
  },
  {
    key:   "fresh",
    title: "Farm Fresh Daily",
    sub:   "Fresh groceries, delivered fast",
    badge: "🌿 Seasonal picks",
    emoji: "🥬",
    cta:   "Shop Fresh",
    bg:    "from-teal-600 via-emerald-600 to-green-700",
    link:  "/user/home",
  },
];

export const getHomeStats = async (_req, res) => {
  try {
    const [
      totalStores,
      totalOrders,
      totalCustomers,
      deliveredToday,
      avgRatingAgg,
      dbBanners,
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
      Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }),
    ]);

    const avgRating = avgRatingAgg[0]?.avg
      ? (Math.round(avgRatingAgg[0].avg * 10) / 10).toFixed(1)
      : "4.8";

    // Use DB banners if any exist; otherwise use defaults
    const banners = dbBanners.length > 0
      ? dbBanners.map((b) => ({
          key:   b._id.toString(),
          title: b.title,
          sub:   b.sub,
          badge: b.badge,
          emoji: b.emoji,
          cta:   b.cta,
          bg:    b.bg,
          link:  b.link,
        }))
      : DEFAULT_BANNERS.map((b) => ({
          ...b,
          sub: b.key === "speed"
            ? `From ${totalStores}+ local stores near you`
            : b.key === "fresh"
            ? `${totalCustomers.toLocaleString()}+ happy customers`
            : b.sub,
        }));

    res.json({
      totalStores,
      totalOrders,
      totalCustomers,
      deliveredToday,
      avgRating,
      features: [
        { key: "delivery",  stat: "10 min",          label: "Avg Delivery",     emoji: "⚡", color: "#f59e0b" },
        { key: "safe",      stat: "100%",             label: "Quality Safe",     emoji: "🛡️", color: "#22c55e" },
        { key: "stores",    stat: `${totalStores}+`,  label: "Open Stores",      emoji: "🏪", color: "#3b82f6" },
        { key: "rating",    stat: `${avgRating}★`,    label: "Avg Store Rating", emoji: "⭐", color: "#a855f7" },
      ],
      banners,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};