/**
 * locationController.js
 * File: backend/src/controllers/locationController.js
 *
 * Handles real-time location updates from delivery partners.
 * Stores latest lat/lng in the Order document and broadcasts
 * via Socket.IO to anyone tracking that order.
 */

import Order from "../models/Order.js";

// ── POST /api/location/:orderId ────────────────────────────────
// Called by the delivery app every ~5 seconds
export const updateDeliveryLocation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    // Validate coordinates
    if (
      lat === undefined ||
      lng === undefined ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return res.status(400).json({
        message:
          "Invalid coordinates. lat must be -90 to 90, lng must be -180 to 180.",
      });
    }

    // Persist to MongoDB in one query.
    const activeStatuses = ["out_for_delivery", "ready_for_pickup", "packing"];
    const updatedAt = new Date();
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryAgentId: req.user.userId,
        status: { $in: activeStatuses },
      },
      {
        deliveryLocation: { lat, lng, updatedAt },
      },
      {
        new: true,
      },
    );

    if (!order) {
      return res.status(403).json({
        message: "Cannot update location",
      });
    }

    // Broadcast via Socket.IO to anyone subscribed to this order's room
    req.io?.to(`order_${orderId}`).emit("location_update", {
      orderId,
      lat,
      lng,
      updatedAt: updatedAt.toISOString(),
    });

    res.json({ success: true, lat, lng, updatedAt });
  } catch (e) {
    console.error("[LocationController] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ── GET /api/location/:orderId ─────────────────────────────────
// Allows the customer to poll the latest location as a fallback
// if Socket.IO is unavailable
export const getDeliveryLocation = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).select(
      "deliveryLocation status deliveryAgentId",
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!order.deliveryLocation?.lat) {
      return res.json({
        available: false,
        message: "Location not yet available",
      });
    }

    res.json({
      available: true,
      lat: order.deliveryLocation.lat,
      lng: order.deliveryLocation.lng,
      updatedAt: order.deliveryLocation.updatedAt,
      status: order.status,
    });
  } catch (e) {
    console.error("[LocationController] GET Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};
