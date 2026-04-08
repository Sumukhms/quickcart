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
  DELIVERY_FEE,
  ORDER_CANCELLABLE_STATUSES,
  DELIVERY_TRIGGER_STATUSES,
  MAX_ORDER_VALUE,
  MIN_ORDER_VALUE,
} from "../config/constants.js";
import Address from "../models/Address.js";
import User from "../models/User.js";
import { sendOrderEmail } from "../services/emailService.js";

// \u2500 Haversine distance calculator for geofencing \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

// ─── Flow helpers ──────────────────────────────────────────────
const FOOD_CATEGORIES = ["Food"];

function getFlowType(storeCategory) {
  return FOOD_CATEGORIES.includes(storeCategory) ? "food" : "grocery";
}

const FLOW_SEQUENCES = {
  food: [
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
  ],
  grocery: ["pending", "confirmed", "packing", "out_for_delivery", "delivered"],
};

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
      return res.status(400).json({ message: "Delivery address required" });
    if (!items || items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });
    if (!storeId)
      return res.status(400).json({ message: "Store ID is required" });
    if (!totalPrice || totalPrice < MIN_ORDER_VALUE) {
      return res.status(400).json({ message: "Invalid order total" });
    }
    if (totalPrice > MAX_ORDER_VALUE) {
      return res
        .status(400)
        .json({ message: `Order value cannot exceed ₹${MAX_ORDER_VALUE}` });
    }

    // Idempotency: prevent duplicate pending orders (60-second window)
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

    // Stock validation per item
    const productIds = items.map((i) => i.productId).filter(Boolean);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = Object.fromEntries(
      products.map((p) => [p._id.toString(), p]),
    );

    for (const item of items) {
      const product = productMap[item.productId?.toString()];
      if (!product) {
        return res
          .status(400)
          .json({ message: `Product "${item.name}" is no longer available` });
      }
      if (!product.available) {
        return res
          .status(400)
          .json({ message: `"${product.name}" is currently unavailable` });
      }
      if (
        product.stock !== undefined &&
        product.stock !== null &&
        product.stock < item.quantity
      ) {
        return res.status(400).json({
          message: `Only ${product.stock} unit${product.stock !== 1 ? "s" : ""} of "${product.name}" available`,
          available: product.stock,
        });
      }
    }

    // ✅ Resolve structured address in placeOrder, after items validation
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

    // Decrement stock (atomic, fire-and-forget errors)
    const bulkStockOps = items
      .filter((i) => i.productId)
      .map((i) => ({
        updateOne: {
          filter: { _id: i.productId, stock: { $gte: i.quantity } },
          update: { $inc: { stock: -i.quantity } },
        },
      }));
    if (bulkStockOps.length) {
      Product.bulkWrite(bulkStockOps)
        .then(() => {
          Product.updateMany(
            { _id: { $in: productIds }, stock: { $lte: 0 } },
            { $set: { available: false } },
          ).catch((err) =>
            console.error("Stock availability update error:", err.message),
          );
        })
        .catch((err) => console.error("Stock decrement error:", err.message));
    }

    await Cart.findOneAndUpdate(
      { userId: req.user.userId },
      { items: [], storeId: null },
    );

    req.io
      ?.to(`store_${storeId}`)
      .emit("new_order", { orderId: order._id, order });

    if (couponCode?.trim()) {
      try {
        await applyCoupon(couponCode.trim().toUpperCase(), req.user.userId);
      } catch (e) {
        console.warn("Coupon usage increment failed:", e.message);
      }
    }

    // ── Notify customer: order placed ────────────────────────
    const store = await Store.findById(storeId).select("name").lean();
    notifyOrderStatus(req.io, {
      userId: req.user.userId,
      orderId: order._id,
      storeName: store?.name || "the store",
      status: "pending",
    }).catch(() => {});

    // ── Email customer: order placed ─────────────────────────────
    User.findById(req.user.userId)
      .select("name email")
      .lean()
      .then((customer) => {
        if (customer?.email) {
          sendOrderEmail(customer.email, customer.name, {
            status: "pending",
            orderId: order._id,
            storeName: store?.name || "the store",
            totalPrice: order.totalPrice,
            deliveryAddress: order.deliveryAddress,
          });
        }
      })
      .catch(() => {});

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
    if (store._id.toString() !== req.params.storeId.toString()) {
      return res
        .status(403)
        .json({ message: "Access denied — not your store" });
    }

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

    if (actorRole === "store" && !STORE_ALLOWED_STATUSES.includes(toStatus)) {
      return res
        .status(403)
        .json({ message: `Store owners cannot set status to "${toStatus}"` });
    }
    if (
      actorRole === "delivery" &&
      !DELIVERY_ALLOWED_STATUSES.includes(toStatus)
    ) {
      return res.status(403).json({
        message: `Delivery partners cannot set status to "${toStatus}"`,
      });
    }

    if (!isValidTransition(order.status, toStatus, storeCategory)) {
      const nextAllowed = getNextStatus(order.status, storeCategory);
      return res.status(400).json({
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

    req.io?.to(`order_${updated._id}`).emit("order_status_update", {
      status: toStatus,
      orderId: updated._id,
      order: updated,
    });
    req.io?.to(`store_${updated.storeId}`).emit("order_updated", {
      orderId: updated._id,
      status: toStatus,
    });

    if (DELIVERY_TRIGGER_STATUSES.includes(toStatus)) {
      req.io?.emit("delivery_available", {
        orderId: updated._id,
        address: updated.deliveryAddress,
        storeId: updated.storeId,
        triggerStatus: toStatus,
      });
    }

    // ── Notify customer of status change ─────────────────────
    notifyOrderStatus(req.io, {
      userId: updated.userId._id || updated.userId,
      orderId: updated._id,
      storeName: order.storeId?.name || "the store",
      status: toStatus,
    }).catch(() => {});

    // ── Email customer on key status changes ──────────────────────
    if (["out_for_delivery", "delivered"].includes(toStatus)) {
      const customerId = updated.userId?._id || updated.userId;
      User.findById(customerId)
        .select("name email")
        .lean()
        .then((customer) => {
          if (customer?.email) {
            sendOrderEmail(customer.email, customer.name, {
              status: toStatus,
              orderId: updated._id,
              storeName: order.storeId?.name || "the store",
              totalPrice: updated.totalPrice,
              deliveryAddress: updated.deliveryAddress,
            });
          }
        })
        .catch(() => {});
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

    // \u2705 If agent has GPS coords, filter to 5km radius; otherwise return all
    const RADIUS_KM = 5;
    let filtered = orders;

    if (agent?.lat && agent?.lng) {
      filtered = orders.filter((order) => {
        // Use store's coords if available; fall back to no filter
        const store = order.storeId;
        if (!store?.lat || !store?.lng) return true;
        const dist = haversineDistanceKm(
          agent.lat,
          agent.lng,
          store.lat,
          store.lng,
        );
        return dist <= RADIUS_KM;
      });

      // \u2705 Fallback: if no orders within radius, return all after 30s window
      if (filtered.length === 0) {
        const FALLBACK_THRESHOLD_MS = 30_000;
        filtered = orders.filter((order) => {
          const age = Date.now() - new Date(order.createdAt).getTime();
          return age >= FALLBACK_THRESHOLD_MS;
        });
      }
    }

    res.json(filtered);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "storeId",
      "name",
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.deliveryAgentId) {
      return res
        .status(400)
        .json({ message: "Order already assigned to a delivery partner" });
    }
    if (!DELIVERY_TRIGGER_STATUSES.includes(order.status)) {
      return res.status(400).json({
        message: `Order is not ready for pickup (status: "${order.status}")`,
      });
    }

    order.deliveryAgentId = req.user.userId;
    order.status = "out_for_delivery";
    order.isAcceptedByDelivery = true;
    order.statusHistory.push({
      status: "out_for_delivery",
      timestamp: new Date(),
      updatedBy: req.user.userId,
    });
    await order.save();

    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "out_for_delivery",
      orderId: order._id,
    });
    req.io?.to(`store_${order.storeId}`).emit("delivery_accepted", {
      orderId: order._id,
      agentId: req.user.userId,
    });

    // ── Notify customer: rider accepted ──────────────────────
    const agentUser = await import("../models/User.js")
      .then((m) => m.default.findById(req.user.userId).select("name").lean())
      .catch(() => null);

    notifyDelivery(req.io, {
      userId: order.userId,
      orderId: order._id,
      agentName: agentUser?.name || "A delivery partner",
    }).catch(() => {});

    // Also notify out_for_delivery status
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
    if (order.deliveryAgentId?.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your delivery" });
    }

    order.status = "delivered";
    order.statusHistory.push({
      status: "delivered",
      timestamp: new Date(),
      updatedBy: req.user.userId,
    });
    await order.save();

    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "delivered",
      orderId: order._id,
    });

    // ── Notify customer: delivered ───────────────────────────
    notifyOrderStatus(req.io, {
      userId: order.userId,
      orderId: order._id,
      storeName: order.storeId?.name || "the store",
      status: "delivered",
    }).catch(() => {});

    // ── Email customer: delivered ─────────────────────────────────
    User.findById(order.userId)
      .select("name email")
      .lean()
      .then((customer) => {
        if (customer?.email) {
          sendOrderEmail(customer.email, customer.name, {
            status: "delivered",
            orderId: order._id,
            storeName: order.storeId?.name || "the store",
            totalPrice: order.totalPrice,
            deliveryAddress: order.deliveryAddress,
          });
        }
      })
      .catch(() => {});

    res.json(order);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateDeliveryLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "lat and lng are required" });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryLocation: { lat, lng } },
      { returnDocument: "after" },
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    req.io
      ?.to(`order_${order._id}`)
      .emit("location_update", { lat, lng, orderId: order._id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * cancelOrder — with notification + stock restore
 */
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "storeId",
      "name",
    );
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not your order" });
    }

    if (!ORDER_CANCELLABLE_STATUSES.includes(order.status)) {
      return res.status(400).json({
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

    // ── Restock items on cancellation ─────────────────────────
    const restoredProductIds = (order.items || [])
      .filter((i) => i.productId && i.quantity)
      .map((i) => i.productId);

    const bulkRestoreOps = (order.items || [])
      .filter((i) => i.productId && i.quantity)
      .map((i) => ({
        updateOne: {
          filter: { _id: i.productId },
          update: { $inc: { stock: i.quantity } },
        },
      }));

    if (bulkRestoreOps.length) {
      Product.bulkWrite(bulkRestoreOps)
        .then(() => {
          Product.updateMany(
            {
              _id: { $in: restoredProductIds },
              stock: { $gt: 0 },
              available: false,
            },
            { $set: { available: true } },
          ).catch((err) =>
            console.error(
              "[cancelOrder] Stock availability restore error:",
              err.message,
            ),
          );
        })
        .catch((err) =>
          console.error("[cancelOrder] Stock restore error:", err.message),
        );
    }

    req.io?.to(`order_${order._id}`).emit("order_status_update", {
      status: "cancelled",
      orderId: order._id,
    });
    req.io?.to(`store_${order.storeId}`).emit("order_updated", {
      orderId: order._id,
      status: "cancelled",
    });

    // ── Notify customer: cancelled ───────────────────────────
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
