import Product from "../models/Product.js";
import Store   from "../models/Store.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name, description, price, originalPrice, category,
      image, storeId, unit, isVeg, spiceLevel, prepTime,
    } = req.body;

    if (!name || price === undefined || price === null || !category || !storeId) {
      return res.status(400).json({ message: "Name, price, category and storeId are required" });
    }

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });
    if (store.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized — this is not your store" });
    }

    const stockVal = req.body.stock !== undefined ? Number(req.body.stock) : 100;

    const product = await Product.create({
      name,
      description: description || "",
      price:         Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      image:    image || "",
      storeId,
      unit:     unit || "",
      isVeg:    isVeg !== undefined ? isVeg : true,
      spiceLevel: spiceLevel || "",
      prepTime:   prepTime || "",
      stock:     Math.max(0, stockVal),
      available: stockVal > 0,
    });

    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getProductsByStore = async (req, res) => {
  try {
    const products = await Product.find({ storeId: req.params.storeId });
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const products = await Product.find({
      $or: [
        { name:        { $regex: q.trim(), $options: "i" } },
        { description: { $regex: q.trim(), $options: "i" } },
        { category:    { $regex: q.trim(), $options: "i" } },
      ],
      available: true,
    })
      .populate("storeId", "name category isOpen deliveryTime image rating")
      .limit(40);
    res.json(products);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("storeId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.storeId.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updateData = { ...req.body };

    // Keep available in sync with stock if stock is being updated
    if (updateData.stock !== undefined) {
      const newStock = Math.max(0, Number(updateData.stock));
      updateData.stock = newStock;
      // Only force available=false when stock hits 0; don't override an explicit available field
      if (newStock === 0 && updateData.available === undefined) {
        updateData.available = false;
      }
      // If stock is positive and available was false (not explicitly set), re-enable
      if (newStock > 0 && updateData.available === undefined && !product.available) {
        updateData.available = true;
      }
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("storeId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.storeId.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};