import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.userId }).populate("items.productId storeId");
    res.json(cart || { items: [], storeId: null });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (!product.available) return res.status(400).json({ message: "Product not available" });

    let cart = await Cart.findOne({ userId: req.user.userId });

    if (!cart) {
      cart = new Cart({ userId: req.user.userId, storeId: product.storeId, items: [] });
    } else if (cart.storeId && cart.storeId.toString() !== product.storeId.toString()) {
      return res.status(400).json({ message: "Clear cart before adding from a different store" });
    }

    const idx = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (idx > -1) cart.items[idx].quantity += quantity;
    else cart.items.push({ productId, quantity });

    cart.storeId = product.storeId;
    await cart.save();
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });
    const idx = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (idx === -1) return res.status(404).json({ message: "Item not in cart" });
    if (quantity <= 0) cart.items.splice(idx, 1);
    else cart.items[idx].quantity = quantity;
    if (cart.items.length === 0) cart.storeId = null;
    await cart.save();
    res.json(cart);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [], storeId: null });
    res.json({ message: "Cart cleared" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};