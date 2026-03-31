import Order from "../models/Order.js";
import Cart  from "../models/Cart.js";
import { applyCoupon } from "./couponController.js";

// ─── Flow helpers (inlined — keep in sync with shared/orderFlows.js) ──
const FOOD_CATEGORIES = ["Food"];

function getFlowType(storeCategory) {
  return FOOD_CATEGORIES.includes(storeCategory) ? "food" : "grocery";
}

const FLOW_SEQUENCES = {
  food:    ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "delivered"],
  grocery: ["pending", "confirmed", "packing", "out_for_delivery", "delivered"],
};

// Statuses that unlock delivery partner assignment
const DELIVERY_TRIGGER_STATUSES = ["ready_for_pickup", "packing"];

function getNextStatus(currentStatus, storeCategory) {
  const seq = FLOW_SEQUENCES[getFlowType(storeCategory)];
  const idx = seq.indexOf(currentStatus);
  if (idx === -1 || idx === seq.length - 1) return null;
  return seq[idx + 1];
}

function isValidTransition(fromStatus, toStatus, storeCategory) {
  if (toStatus === "cancelled") {
    return !["delivered", "cancelled"].includes(fromStatus);
  }
  return getNextStatus(fromStatus, storeCategory) === toStatus;
}

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
      couponCode,
    } = req.body;

    if (!deliveryAddress?.trim())       return res.status(400).json({ message: "Delivery address required" });
    if (!items || items.length === 0)   return res.status(400).json({ message: "Cart is empty" });
    if (!storeId)                       return res.status(400).json({ message: "Store ID is required" });
    if (!totalPrice || totalPrice <= 0) return res.status(400).json({ message: "Invalid total price" });

    const order = await Order.create({
      userId: req.user.userId,
      storeId,
      items,
      totalPrice,
      deliveryAddress,
      paymentMethod: paymentMethod || "cod",
      notes,
      statusHistory: [{ status: "pending", timestamp: new Date(), updatedBy: req.user.userId }],
    });

    await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [], storeId: null });

    req.io?.to(`store_${storeId}`).emit("new_order", { orderId: order._id, order });

    // Increment coupon usage AFTER order is safely persisted
    if (couponCode?.trim()) {
      try { await applyCoupon(couponCode.trim().toUpperCase()); }
      catch (e) { console.warn("Coupon usage increment failed:", e.message); }
    }

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

/**
 * updateOrderStatus — category-aware transition validation.
 *
 * The store's category is read from the populated storeId so we
 * know which flow (food vs grocery) applies, then we check that
 * the requested "toStatus" is exactly the next valid step.
 */
// ─── Role-based status permissions ───────────────────────────
const STORE_ALLOWED_STATUSES = ["confirmed", "preparing", "packing", "ready_for_pickup", "cancelled"];
const DELIVERY_ALLOWED_STATUSES = ["out_for_delivery", "delivered"];

export const updateOrderStatus = async (req, res) => {
  try {
    const { status: toStatus } = req.body;
    const actorRole = req.user.role; // "store" or "delivery"

    const order = await Order.findById(req.params.id).populate("storeId", "name category");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const storeCategory = order.storeId?.category || "Other";

    // ── Role gate ─────────────────────────────────────────────
    if (actorRole === "store" && !STORE_ALLOWED_STATUSES.includes(toStatus)) {
      return res.status(403).json({
        message: `Store owners cannot set status to "${toStatus}"`,
      });
    }
    if (actorRole === "delivery" && !DELIVERY_ALLOWED_STATUSES.includes(toStatus)) {
      return res.status(403).json({
        message: `Delivery partners cannot set status to "${toStatus}"`,
      });
    }

    // ── Flow sequence validation ──────────────────────────────
    const allKnownStatuses = [
      "pending", "confirmed", "preparing", "packing",
      "ready_for_pickup", "out_for_delivery", "delivered", "cancelled",
    ];
    if (!allKnownStatuses.includes(toStatus)) {
      return res.status(400).json({ message: `Unknown status: "${toStatus}"` });
    }

    if (!isValidTransition(order.status, toStatus, storeCategory)) {
      const nextAllowed = getNextStatus(order.status, storeCategory);
      return res.status(400).json({
        message: `Invalid transition for ${storeCategory} orders: "${order.status}" → "${toStatus}". Expected: "${nextAllowed || "none"}"`,
        currentStatus: order.status,
        allowedNext: nextAllowed,
        storeCategory,
      });
    }

    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: toStatus,
        $push: {
          statusHistory: { status: toStatus, timestamp: new Date(), updatedBy: req.user.userId },
        },
      },
      { returnDocument: "after" }
    ).populate("userId", "name phone");

    req.io?.to(`order_${updated._id}`).emit("order_status_update", {
      status: toStatus, orderId: updated._id, order: updated,
    });
    req.io?.to(`store_${updated.storeId}`).emit("order_updated", {
      orderId: updated._id, status: toStatus,
    });

    if (DELIVERY_TRIGGER_STATUSES.includes(toStatus)) {
      req.io?.emit("delivery_available", {
        orderId: updated._id,
        address: updated.deliveryAddress,
        storeId: updated.storeId,
        triggerStatus: toStatus,
      });
    }

    res.json(updated);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── DELIVERY PARTNER ─────────────────────────────────────────

/**
 * getAvailableOrders
 * Queries both trigger statuses so food and grocery orders
 * both surface in the delivery partner's feed.
 */
export const getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status:          { $in: DELIVERY_TRIGGER_STATUSES },
      deliveryAgentId: null,
    })
      .populate("storeId", "name address phone category")
      .populate("userId", "name phone address")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

/**
 * acceptDelivery
 * Accepts from either trigger status (ready_for_pickup / packing).
 */
export const acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.deliveryAgentId) {
      return res.status(400).json({ message: "Order already assigned to a delivery partner" });
    }
    if (!DELIVERY_TRIGGER_STATUSES.includes(order.status)) {
      return res.status(400).json({
        message: `Order is not ready for delivery pickup (status: "${order.status}")`,
      });
    }

    order.deliveryAgentId     = req.user.userId;
    order.status              = "out_for_delivery";
    order.isAcceptedByDelivery = true;
    order.statusHistory.push({
      status: "out_for_delivery", timestamp: new Date(), updatedBy: req.user.userId,
    });
    await order.save();

    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "out_for_delivery", orderId: order._id,
    });
    req.io?.to(`store_${order.storeId}`).emit("delivery_accepted", {
      orderId: order._id, agentId: req.user.userId,
    });

    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const getMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { deliveryAgentId: req.user.userId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("storeId", "name address phone category")
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

    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "delivered", orderId: order._id,
    });

    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateDeliveryLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryLocation: { lat, lng } },
      { returnDocument: "after" }
    );
    req.io?.to(`order_${order._id}`).emit("location_update", { lat, lng, orderId: order._id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ─── Add this export to the bottom of orderController.js ─────

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only the customer who placed the order can cancel
    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your order" });
    }

    const cancellable = ["pending", "confirmed"];
    if (!cancellable.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot cancel — order is already "${order.status}". Only pending or confirmed orders can be cancelled.`,
      });
    }

    order.status = "cancelled";
    order.statusHistory.push({
      status:    "cancelled",
      timestamp: new Date(),
      updatedBy: req.user.userId,
    });
    await order.save();

    // Notify customer + store in real time
    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "cancelled", orderId: order._id,
    });
    req.io?.to(`store_${order.storeId}`).emit("order_updated", {
      orderId: order._id, status: "cancelled",
    });

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};