import express from "express";
import {
  placeOrder, getMyOrders, getOrderById, updateOrderStatus, getStoreOrders,
  getAvailableOrders, acceptDelivery, getMyDeliveries, markDelivered, updateDeliveryLocation
} from "../controllers/orderController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// ── CUSTOMER routes ──
r.post("/",        protect, restrictTo("customer"),  placeOrder);
r.get("/my",       protect, restrictTo("customer"),  getMyOrders);
r.get("/:id",      protect, getOrderById); // any logged-in user

// ── STORE OWNER routes ──
r.get("/store/:storeId",   protect, restrictTo("store"),    getStoreOrders);
r.put("/:id/status",       protect, restrictTo("store"),    updateOrderStatus);

// ── DELIVERY PARTNER routes ──
r.get("/delivery/available",  protect, restrictTo("delivery"), getAvailableOrders);
r.get("/delivery/mine",       protect, restrictTo("delivery"), getMyDeliveries);
r.post("/:id/accept",         protect, restrictTo("delivery"), acceptDelivery);
r.post("/:id/delivered",      protect, restrictTo("delivery"), markDelivered);
r.put("/:id/location",        protect, restrictTo("delivery"), updateDeliveryLocation);

export default r;