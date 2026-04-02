/**
 * inventoryController.js
 *
 * Handles inventory management for store owners.
 * Behaviour differs by store category:
 *   Food      → availability toggle only (food doesn't track stock units)
 *   Grocery   → full stock count + low-stock alerts (threshold: 10)
 *   Other     → full stock count + low-stock alerts (threshold: 5)
 *   Snacks / Beverages / Medicines → stock count + configurable thresholds
 */
import Product from "../models/Product.js";
import Store   from "../models/Store.js";

// Low-stock thresholds by category
const LOW_STOCK_THRESHOLDS = {
  Groceries: 10,
  Snacks:    15,
  Beverages: 10,
  Medicines: 5,
  Other:     5,
  Food:      null, // food doesn't use stock counts
};

async function getOwnedStore(userId) {
  const store = await Store.findOne({ ownerId: userId });
  if (!store) throw Object.assign(new Error("No store found for this account"), { status: 404 });
  return store;
}

// ── GET /api/inventory ────────────────────────────────────────
export const getInventory = async (req, res) => {
  try {
    const store    = await getOwnedStore(req.user.userId);
    const isFood   = store.category === "Food";

    const products = await Product.find({ storeId: store._id }).sort({ category: 1, name: 1 });

    // Group by category
    const grouped = {};
    for (const p of products) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }

    const threshold = LOW_STOCK_THRESHOLDS[store.category] ?? 10;

    res.json({
      storeCategory: store.category,
      isFood,
      threshold,
      products,
      grouped,
      stats: {
        total:       products.length,
        available:   products.filter(p => p.available).length,
        outOfStock:  products.filter(p => !p.available || (p.stock !== null && p.stock <= 0)).length,
        lowStock:    isFood ? 0 : products.filter(p => p.available && p.stock !== null && p.stock > 0 && p.stock <= threshold).length,
      },
    });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── PATCH /api/inventory/:id/stock ────────────────────────────
export const updateStock = async (req, res) => {
  try {
    const store   = await getOwnedStore(req.user.userId);
    const { stock, operation, amount } = req.body;
    // operation: "set" | "add" | "subtract"

    const product = await Product.findOne({ _id: req.params.id, storeId: store._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (store.category === "Food") {
      return res.status(400).json({ message: "Food items use availability toggle instead of stock count" });
    }

    let newStock;
    if (operation === "add") {
      newStock = (product.stock || 0) + Number(amount || 0);
    } else if (operation === "subtract") {
      newStock = Math.max(0, (product.stock || 0) - Number(amount || 0));
    } else {
      // "set" (default)
      newStock = Math.max(0, Number(stock));
    }

    product.stock     = newStock;
    product.available = newStock > 0;
    await product.save();

    res.json(product);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── PATCH /api/inventory/:id/toggle ──────────────────────────
export const toggleAvailability = async (req, res) => {
  try {
    const store   = await getOwnedStore(req.user.userId);
    const product = await Product.findOne({ _id: req.params.id, storeId: store._id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.available = !product.available;

    // For non-food: if marking available but stock is 0, set to 1
    if (store.category !== "Food" && product.available && product.stock <= 0) {
      product.stock = 1;
    }

    await product.save();
    res.json(product);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── POST /api/inventory/bulk ──────────────────────────────────
export const bulkUpdateStock = async (req, res) => {
  try {
    const store   = await getOwnedStore(req.user.userId);
    const { updates } = req.body; // [{ productId, stock }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "updates array is required" });
    }

    if (store.category === "Food") {
      return res.status(400).json({ message: "Food stores use availability toggle" });
    }

    const ops = updates.map(({ productId, stock }) => ({
      updateOne: {
        filter: { _id: productId, storeId: store._id },
        update: {
          $set: {
            stock:     Math.max(0, Number(stock)),
            available: Number(stock) > 0,
          },
        },
      },
    }));

    const result = await Product.bulkWrite(ops);
    res.json({ updated: result.modifiedCount });
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};

// ── GET /api/inventory/alerts ─────────────────────────────────
export const getLowStockAlerts = async (req, res) => {
  try {
    const store    = await getOwnedStore(req.user.userId);
    if (store.category === "Food") return res.json([]);

    const threshold = LOW_STOCK_THRESHOLDS[store.category] ?? 10;
    const alerts    = await Product.find({
      storeId:   store._id,
      available: true,
      stock:     { $gt: 0, $lte: threshold },
    }).sort({ stock: 1 });

    res.json(alerts);
  } catch (e) {
    res.status(e.status || 500).json({ message: e.message });
  }
};