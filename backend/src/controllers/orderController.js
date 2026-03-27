import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// ─── CUSTOMER ─────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const {
      items,
      storeId,
      totalPrice,
      deliveryAddress,
      paymentMethod,
      notes,
    } = req.body;

    // 🔒 Basic validations
    if (!deliveryAddress || !deliveryAddress.trim()) {
      return res.status(400).json({ message: "Delivery address required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!storeId) {
      return res.status(400).json({ message: "Store ID is required" });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ message: "Invalid total price" });
    }

    // 🧾 Create order directly from frontend payload
    const order = await Order.create({
      userId: req.user.userId,
      storeId,
      items,
      totalPrice,
      deliveryAddress,
      paymentMethod: paymentMethod || "cod",
      notes,
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
          updatedBy: req.user.userId,
        },
      ],
    });

    // 🧹 Optional: clear DB cart (if exists)
    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null }
    );

    // 🔔 Notify store (real-time)
    req.io?.to(`store_${storeId}`).emit("new_order", {
      orderId: order._id,
      order,
    });

    // ✅ Success response
    res.status(201).json(order);

  } catch (e) {
    console.error("Place Order Error:", e);
    res.status(500).json({ message: "Server error while placing order" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
      .populate("storeId", "name image category deliveryTime")
      .populate("deliveryAgentId", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("storeId", "name image phone address category")
      .populate("userId", "name phone address")
      .populate("deliveryAgentId", "name phone vehicleType rating");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── STORE OWNER ──────────────────────────────────────────────
export const getStoreOrders = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter = { storeId: req.params.storeId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("userId", "name phone address")
      .populate("deliveryAgentId", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        $push: { statusHistory: { status, timestamp: new Date(), updatedBy: req.user.userId } }
      },
      { new: true }
    ).populate("userId", "name phone");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Real-time notifications
    req.io?.to(`order_${order._id}`).emit("order_status_update", { status, orderId: order._id, order });
    req.io?.to(`store_${order.storeId}`).emit("order_updated", { orderId: order._id, status });

    // When ready for pickup, notify all available delivery agents
    if (status === "ready_for_pickup") {
      req.io?.emit("delivery_available", { orderId: order._id, address: order.deliveryAddress, storeId: order.storeId });
    }

    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── DELIVERY PARTNER ─────────────────────────────────────────
export const getAvailableOrders = async (req, res) => {
  try {
    // Orders that are ready for pickup and have no delivery agent
    const orders = await Order.find({
      status: "ready_for_pickup",
      deliveryAgentId: null,
    })
      .populate("storeId", "name address phone")
      .populate("userId", "name phone address")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.deliveryAgentId) return res.status(400).json({ message: "Order already assigned to a delivery partner" });
    if (order.status !== "ready_for_pickup") return res.status(400).json({ message: "Order not ready for pickup" });

    order.deliveryAgentId = req.user.userId;
    order.status = "out_for_delivery";
    order.isAcceptedByDelivery = true;
    order.statusHistory.push({ status: "out_for_delivery", timestamp: new Date(), updatedBy: req.user.userId });
    await order.save();

    // Notify customer and store
    req.io?.to(`order_${order._id}`).emit("order_status_update", { status: "out_for_delivery", orderId: order._id });
    req.io?.to(`store_${order.storeId}`).emit("delivery_accepted", { orderId: order._id, agentId: req.user.userId });

    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { deliveryAgentId: req.user.userId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("storeId", "name address phone")
      .populate("userId", "name phone address")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const markDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.deliveryAgentId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your delivery" });
    }

    order.status = "delivered";
    order.statusHistory.push({ status: "delivered", timestamp: new Date(), updatedBy: req.user.userId });
    await order.save();

    req.io?.to(`order_${order._id}`).emit("order_status_update", { status: "delivered", orderId: order._id });

    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateDeliveryLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryLocation: { lat, lng } },
      { new: true }
    );
    req.io?.to(`order_${order._id}`).emit("location_update", { lat, lng, orderId: order._id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};