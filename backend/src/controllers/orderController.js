import mongoose from "mongoose";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";
import { applyCoupon } from "./couponController.js";
import {
  notifyOrderStatus,
  notifyDelivery,
} from "../services/notificationService.js";
import {
  emitDeliveryAvailable,
  emitOrderStatusUpdate,
  emitStoreOrderUpdate,
} from "../services/orderEventService.js";
import {
  DELIVERY_FEE,
  ORDER_CANCELLABLE_STATUSES,
  DELIVERY_TRIGGER_STATUSES,
  MAX_ORDER_VALUE,
  MIN_ORDER_VALUE,
} from "../config/constants.js";
import { getNextStatus, isValidTransition } from "../utils/orderFlows.js";
import Address from "../models/Address.js";
import User from "../models/User.js";
import { sendOrderStatusEmail } from "../services/orderEmailService.js";
import {
  decreaseStock,
  restoreStock,
  validateStock,
} from "../services/inventoryService.js";

// ── Haversine distance (km) ───────────────────────────────────
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Role-based status permissions
const STORE_ALLOWED_STATUSES = [
  "confirmed",
  "preparing",
  "packing",
  "ready_for_pickup",
  "cancelled",
];
const DELIVERY_ALLOWED_STATUSES = ["out_for_delivery", "delivered"];

// ─── CUSTOMER ──────────────────────────────────────────────────

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

    if (!deliveryAddress?.trim())
      return res.status(409).json({ message: "Delivery address required" });
    if (!items || items.length === 0)
      return res.status(409).json({ message: "Cart is empty" });
    if (!storeId)
      return res.status(409).json({ message: "Store ID is required" });
    if (!totalPrice || totalPrice < MIN_ORDER_VALUE)
      return res.status(409).json({ message: "Invalid order total" });
    if (totalPrice > MAX_ORDER_VALUE)
      return res
        .status(400)
        .json({ message: `Order value cannot exceed ₹${MAX_ORDER_VALUE}` });

    // Idempotency: prevent duplicate orders within 60s
    const recentPending = await Order.findOne({
      userId: req.user.userId,
      storeId,
      status: "pending",
      createdAt: { $gte: new Date(Date.now() - 60_000) },
    });
    if (recentPending) {
      return res.status(409).json({
        message:
          "Duplicate order detected. Your previous order is still being processed.",
        orderId: recentPending._id,
      });
    }

    const stockValidation = await validateStock(items);
    if (!stockValidation.valid) {
      return res.status(stockValidation.status).json(stockValidation.payload);
    }

    // Resolve structured address if addressId provided
    let resolvedDeliveryAddress = deliveryAddress?.trim();
    let resolvedLat = req.body.deliveryLat ?? null;
    let resolvedLng = req.body.deliveryLng ?? null;

    if (
      req.body.addressId &&
      mongoose.Types.ObjectId.isValid(req.body.addressId)
    ) {
      const addrDoc = await Address.findOne({
        _id: req.body.addressId,
        userId: req.user.userId,
      });
      if (addrDoc) {
        resolvedDeliveryAddress = addrDoc.toOneLiner();
        resolvedLat = addrDoc.lat;
        resolvedLng = addrDoc.lng;
      }
    }

    const order = await Order.create({
      userId: req.user.userId,
      storeId,
      items,
      totalPrice,
      deliveryFee: DELIVERY_FEE,
      deliveryAddress: resolvedDeliveryAddress,
      deliveryLat: resolvedLat,
      deliveryLng: resolvedLng,
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

    // Decrement stock (fire-and-forget)
    decreaseStock(items).catch((err) =>
      console.error("[placeOrder] Stock update error:", err.message),
    );

    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null },
    );

    req.io
      ?.to(`store_${storeId}`)
      .emit("new_order", { orderId: order._id, order });

    if (couponCode?.trim()) {
      applyCoupon(couponCode.trim().toUpperCase(), req.user.userId).catch((e) =>
        console.warn("[placeOrder] Coupon usage increment failed:", e.message),
      );
    }

    // Notify & email customer
    const store = await Store.findById(storeId).select("name").lean();
    notifyOrderStatus(req.io, {
      userId: req.user.userId,
      orderId: order._id,
      storeName: store?.name || "the store",
      status: "pending",
    }).catch(() => {});

    sendOrderStatusEmail({
      userId: req.user.userId,
      status: "pending",
      orderId: order._id,
      storeName: store?.name || "the store",
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
    });

    res.status(201).json(order);
  } catch (e) {
    console.error("[placeOrder] Error:", e);
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
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("storeId", "name image phone address category")
      .populate("userId", "name phone address")
      .populate("deliveryAgentId", "name phone vehicleType rating");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ── Role-based access control ──────────────────────────
    const userId = req.user.userId;
    const role = req.user.role;

    if (role === "user") {
      if (order.userId._id.toString() !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (role === "delivery") {
      if (
        !order.deliveryAgentId ||
        order.deliveryAgentId._id.toString() !== userId
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (role === "store") {
      const store = await Store.findOne({ ownerId: userId });

      if (!store || store._id.toString() !== order.storeId._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── STORE OWNER ───────────────────────────────────────────────

export const getStoreOrders = async (req, res) => {
  try {
    const store = await Store.findOne({ ownerId: req.user.userId });
    if (!store)
      return res
        .status(404)
        .json({ message: "No store found for this account" });
    if (store._id.toString() !== req.params.storeId.toString())
      return res
        .status(403)
        .json({ message: "Access denied — not your store" });

    const { status, limit = 50 } = req.query;
    const filter = { storeId: store._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate("userId", "name phone address")
      .populate("deliveryAgentId", "name phone")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status: toStatus } = req.body;
    const actorRole = req.user.role;

    const order = await Order.findById(req.params.id).populate(
      "storeId",
      "name category",
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    const storeCategory = order.storeId?.category || "Other";

    if (actorRole === "store" && !STORE_ALLOWED_STATUSES.includes(toStatus))
      return res
        .status(403)
        .json({ message: `Store owners cannot set status to "${toStatus}"` });
    if (
      actorRole === "delivery" &&
      !DELIVERY_ALLOWED_STATUSES.includes(toStatus)
    )
      return res.status(403).json({
        message: `Delivery partners cannot set status to "${toStatus}"`,
      });

    if (!isValidTransition(order.status, toStatus, storeCategory)) {
      const nextAllowed = getNextStatus(order.status, storeCategory);
      return res.status(409).json({
        message: `Invalid transition for ${storeCategory}: "${order.status}" → "${toStatus}". Expected: "${nextAllowed || "none"}"`,
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
          statusHistory: {
            status: toStatus,
            timestamp: new Date(),
            updatedBy: req.user.userId,
          },
        },
      },
      { returnDocument: "after" },
    ).populate("userId", "name phone");

    emitOrderStatusUpdate(req.io, updated);
    emitStoreOrderUpdate(req.io, updated);

    if (DELIVERY_TRIGGER_STATUSES.includes(toStatus)) {
      emitDeliveryAvailable(req.io, updated);
    }

    notifyOrderStatus(req.io, {
      userId: updated.userId._id || updated.userId,
      orderId: updated._id,
      storeName: order.storeId?.name || "the store",
      status: toStatus,
    }).catch(() => {});

    if (["out_for_delivery", "delivered"].includes(toStatus)) {
      const customerId = updated.userId?._id || updated.userId;
      sendOrderStatusEmail({
        userId: customerId,
        status: toStatus,
        orderId: updated._id,
        storeName: order.storeId?.name || "the store",
        totalPrice: updated.totalPrice,
        deliveryAddress: updated.deliveryAddress,
      });
    }

    res.json(updated);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─── DELIVERY PARTNER ──────────────────────────────────────────

export const getAvailableOrders = async (req, res) => {
  try {
    const agent = await User.findById(req.user.userId).select(
      "lat lng isAvailable",
    );

    const orders = await Order.find({
      status: { $in: DELIVERY_TRIGGER_STATUSES },
      deliveryAgentId: null,
    })
      .populate("storeId", "name address phone category lat lng")
      .populate("userId", "name phone address")
      .sort({ createdAt: -1 });

    const RADIUS_KM = 5;
    let filtered = orders;

    if (agent?.lat && agent?.lng) {
      filtered = orders.filter((order) => {
        const store = order.storeId;
        if (!store?.lat || !store?.lng) return true;
        return (
          haversineDistanceKm(agent.lat, agent.lng, store.lat, store.lng) <=
          RADIUS_KM
        );
      });

      // Fallback: if no orders within radius, return orders older than 30s
      if (filtered.length === 0) {
        filtered = orders.filter(
          (order) => Date.now() - new Date(order.createdAt).getTime() >= 30_000,
        );
      }
    }

    res.json(filtered);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        deliveryAgentId: null,
        status: { $in: DELIVERY_TRIGGER_STATUSES },
      },
      {
        $set: {
          deliveryAgentId: req.user.userId,
          status: "out_for_delivery",
          isAcceptedByDelivery: true,
        },
        $push: {
          statusHistory: {
            status: "out_for_delivery",
            timestamp: new Date(),
            updatedBy: req.user.userId,
          },
        },
      },
      {
        new: true,
      },
    ).populate("storeId", "name");

    if (!order) {
      return res.status(409).json({
        message:
          "Order was already accepted by another delivery partner or is no longer available",
      });
    }

    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "out_for_delivery",
      orderId: order._id,
    });
    req.io?.to(`store_${order.storeId}`).emit("delivery_accepted", {
      orderId: order._id,
      agentId: req.user.userId,
    });

    const agentUser = await User.findById(req.user.userId)
      .select("name")
      .lean()
      .catch(() => null);

    notifyDelivery(req.io, {
      userId: order.userId,
      orderId: order._id,
      agentName: agentUser?.name || "A delivery partner",
    }).catch(() => {});

    notifyOrderStatus(req.io, {
      userId: order.userId,
      orderId: order._id,
      storeName: order.storeId?.name || "the store",
      status: "out_for_delivery",
    }).catch(() => {});

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
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
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const markDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "storeId",
      "name",
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.deliveryAgentId?.toString() !== req.user.userId)
      return res.status(403).json({ message: "Not your delivery" });

    order.status = "delivered";
    order.statusHistory.push({
      status: "delivered",
      timestamp: new Date(),
      updatedBy: req.user.userId,
    });
    await order.save();

    req.io
      ?.to(`order_${order._id}`)
      .emit("order_status_update", { status: "delivered", orderId: order._id });

    notifyOrderStatus(req.io, {
      userId: order.userId,
      orderId: order._id,
      storeName: order.storeId?.name || "the store",
      status: "delivered",
    }).catch(() => {});

    sendOrderStatusEmail({
      userId: order.userId,
      status: "delivered",
      orderId: order._id,
      storeName: order.storeId?.name || "the store",
      totalPrice: order.totalPrice,
      deliveryAddress: order.deliveryAddress,
    });

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "storeId",
      "name",
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.userId.toString() !== req.user.userId)
      return res.status(403).json({ message: "Not your order" });
    if (!ORDER_CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(409).json({
        message: `Cannot cancel — order is "${order.status}". Only ${ORDER_CANCELLABLE_STATUSES.join(" or ")} orders can be cancelled.`,
      });
    }

    order.status = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      updatedBy: req.user.userId,
    });
    await order.save();

    // Restore stock (fire-and-forget)
    restoreStock(order.items).catch((err) =>
      console.error("[cancelOrder] Stock restore error:", err.message),
    );

    req.io
      ?.to(`order_${order._id}`)
      .emit("order_status_update", { status: "cancelled", orderId: order._id });
    req.io
      ?.to(`store_${order.storeId}`)
      .emit("order_updated", { orderId: order._id, status: "cancelled" });

    notifyOrderStatus(req.io, {
      userId: order.userId,
      orderId: order._id,
      storeName: order.storeId?.name || "the store",
      status: "cancelled",
    }).catch(() => {});

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
