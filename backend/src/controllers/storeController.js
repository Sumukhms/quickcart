import Store from "../models/Store.js";

export const createStore = async (req, res) => {
  try {
    const { name, phone, address, category, description, image, deliveryTime, minOrder } = req.body;
    if (!name || !phone || !address || !category) {
      return res.status(400).json({ message: "Name, phone, address and category are required" });
    }

    // Check if this owner already has a store
    const existing = await Store.findOne({ ownerId: req.user.userId });
    if (existing) {
      return res.status(400).json({ message: "You already have a store. Update it instead." });
    }

    const store = await Store.create({
      name,
      phone,
      address,
      category,
      description: description || "",
      image: image || "",
      deliveryTime: deliveryTime || "20-30 min",
      minOrder: minOrder || 0,
      ownerId: req.user.userId,
    });

    res.status(201).json(store);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getStores = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };
    const stores = await Store.find(filter).sort({ rating: -1 });
    res.json(stores);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate("ownerId", "name email phone");
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
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
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.userId });
    if (!store) return res.status(404).json({ message: "No store found" });
    res.json(store);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};