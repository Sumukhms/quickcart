import Store from "../models/Store.js";
import Order from "../models/Order.js";   // ← FIXED: was missing, caused analytics crash

export const createStore = async (req, res) => {
  try {
    const { name, phone, address, category, description, image, deliveryTime, minOrder } = req.body;
    if (!name || !phone || !address || !category) {
      return res.status(400).json({ message: "Name, phone, address and category are required" });
    }

    const existing = await Store.findOne({ ownerId: req.user.userId });
    if (existing) {
      return res.status(400).json({ message: "You already have a store. Update it instead." });
    }

    const store = await Store.create({
      name, phone, address, category,
      description: description || "",
      image:        image || "",
      deliveryTime: deliveryTime || "20-30 min",
      minOrder:     minOrder || 0,
      ownerId:      req.user.userId,
    });

    res.status(201).json(store);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getStores = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    const stores = await Store.find(filter).sort({ rating: -1 });
    res.json(stores);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate("ownerId", "name email phone");
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateStore = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    if (store.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const updated = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.userId });
    if (!store) return res.status(404).json({ message: "No store found" });
    res.json(store);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getStoreAnalytics = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.userId });
    if (!store) return res.status(404).json({ message: "No store found" });

    const storeId = store._id;

    const topProducts = await Order.aggregate([
      { $match: { storeId, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      { $group: {
        _id:       "$items.name",
        totalSold: { $sum: "$items.quantity" },
        revenue:   { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, name: "$_id", totalSold: 1, revenue: 1 } },
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
    const revenueByDay = await Order.aggregate([
      { $match: { storeId, status: { $ne: "cancelled" }, createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id:     { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" },
        orders:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    res.json({ topProducts, revenueByDay });
  } catch (e) { res.status(500).json({ message: e.message }); }
};