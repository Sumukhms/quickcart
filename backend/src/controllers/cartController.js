/**
 * cartController — PRODUCTION FIXED
 *
 * Fixes:
 *   1. ObjectId validation on productId before DB queries (prevents Mongoose cast errors / 500s)
 *   2. Stock guards (already in place, kept)
 *   3. Consistent error response format
 */
import Cart    from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate(
      "items.productId storeId"
    );
    res.json(cart || { items: [], storeId: null });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return res.status(400).json({ message: "Quantity must be between 1 and 100" });
    }

    const product = await Product.findById(productId);
    if (!product)          return res.status(404).json({ message: "Product not found" });
    if (!product.available) return res.status(400).json({ message: "Product is not available" });

    if (product.stock !== undefined && product.stock !== null && product.stock <= 0) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, storeId: product.storeId, items: [] });
    } else if (cart.storeId && cart.storeId.toString() !== product.storeId.toString()) {
      return res.status(400).json({
        message: "Clear your cart before adding items from a different store",
      });
    }

    const idx    = cart.items.findIndex((i) => i.productId.toString() === productId);
    const newQty = idx > -1 ? cart.items[idx].quantity + qty : qty;

    if (product.stock !== undefined && product.stock !== null && newQty > product.stock) {
      return res.status(400).json({
        message:   `Only ${product.stock} unit${product.stock > 1 ? "s" : ""} available`,
        available: product.stock,
      });
    }

    if (idx > -1) cart.items[idx].quantity += qty;
    else          cart.items.push({ productId, quantity: qty });

    cart.storeId = product.storeId;
    await cart.save();
    res.json(cart);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const idx = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (idx === -1) return res.status(404).json({ message: "Item not in cart" });

    if (qty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      if (qty > cart.items[idx].quantity) {
        const product = await Product.findById(productId);
        if (product) {
          if (!product.available) {
            return res.status(400).json({ message: "Product is no longer available" });
          }
          if (product.stock !== undefined && product.stock !== null && qty > product.stock) {
            return res.status(400).json({
              message:   `Only ${product.stock} unit${product.stock > 1 ? "s" : ""} available`,
              available: product.stock,
            });
          }
        }
      }
      cart.items[idx].quantity = qty;
    }

    if (cart.items.length === 0) cart.storeId = null;
    await cart.save();
    res.json(cart);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null }
    );
    res.json({ message: "Cart cleared" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};