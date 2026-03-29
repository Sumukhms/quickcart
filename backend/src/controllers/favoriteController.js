/**
 * favoriteController.js
 *
 * Handles add/remove/get favorite stores for a customer.
 *
 * Routes:
 *   POST   /api/favorites/toggle   { storeId }  → add or remove
 *   GET    /api/favorites           → list all favorite stores (populated)
 */
import User  from "../models/User.js";
import Store from "../models/Store.js";

/**
 * Toggle a store in the user's favoriteStores list.
 * Returns { isFavorite, favoriteStores }
 */
export const toggleFavorite = async (req, res) => {
  try {
    const { storeId } = req.body;
    if (!storeId) return res.status(400).json({ message: "storeId is required" });

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const idx = user.favoriteStores.findIndex(
      (id) => id.toString() === storeId.toString()
    );

    let isFavorite;
    if (idx > -1) {
      // Already favorited → remove
      user.favoriteStores.splice(idx, 1);
      isFavorite = false;
    } else {
      // Not favorited → add
      user.favoriteStores.push(storeId);
      isFavorite = true;
    }

    await user.save();

    res.json({ isFavorite, favoriteStores: user.favoriteStores });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * Get all favorite stores for the logged-in user (populated).
 */
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("favoriteStores")
      .select("favoriteStores");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.favoriteStores || []);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};