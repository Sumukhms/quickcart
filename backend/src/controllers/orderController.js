import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const placeOrder = async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod } = req.body;
    if (!deliveryAddress) return res.status(400).json({ message: "Delivery address required" });

    const cart = await Cart.findOne({ userId: req.user.userId }).populate("items.productId");
    if (!cart || !cart.items.length) return res.status(400).json({ message: "Cart is empty" });

    let totalPrice = 0;
    const orderItems = cart.items.map((item) => {
      const p = item.productId;
      totalPrice += p.price * item.quantity;
      return { productId: p._id, name: p.name, price: p.price, quantity: item.quantity, image: p.image };
    });

    const order = await Order.create({
      userId: req.user.userId,
      storeId: cart.storeId,
      items: orderItems,
      totalPrice,
      deliveryAddress,
      paymentMethod: paymentMethod || "cod",
    });

    await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [], storeId: null });

    res.status(201).json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("storeId", "name image category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("storeId", "name image phone address")
      .populate("userId", "name phone");
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Not found" });
    req.io?.emit(`order_${order._id}`, { status, orderId: order._id });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getStoreOrders = async (req, res) => {
  try {
    const store = req.params.storeId;
    const orders = await Order.find({ storeId: store })
      .populate("userId", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};