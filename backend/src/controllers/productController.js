import Product from "../models/Product.js";
import Store from "../models/Store.js";

export const createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, image, storeId, unit } = req.body;
    if (!name || !price || !category || !storeId) return res.status(400).json({ message: "Missing fields" });
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    if (store.ownerId.toString() !== req.user.userId) return res.status(403).json({ message: "Not authorized" });
    const product = await Product.create({ name, description, price, originalPrice, category, image, storeId, unit });
    res.status(201).json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getProductsByStore = async (req, res) => {
  try {
    const products = await Product.find({ storeId: req.params.storeId, available: true });
    res.json(products);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("storeId");
    if (!product) return res.status(404).json({ message: "Not found" });
    if (product.storeId.ownerId.toString() !== req.user.userId) return res.status(403).json({ message: "Not authorized" });
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};