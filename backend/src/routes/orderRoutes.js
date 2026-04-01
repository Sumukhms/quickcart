/**
 * orderRoutes.js — FIXED
 *
 * Critical fix: Express matches routes top-to-bottom.
 * Routes with specific path segments (/my, /delivery/available, etc.)
 * MUST come before dynamic segments (/:id) or they will never match.
 *
 * Route ordering (most-specific → least-specific):
 *   1. Static paths:      GET /my, GET /delivery/available, GET /delivery/mine
 *   2. Dynamic paths:     GET /:id
 *   3. Action sub-paths:  POST /:id/cancel, POST /:id/accept, etc.
 */
import express from "express";
import {
  placeOrder, getMyOrders, getOrderById, updateOrderStatus, getStoreOrders,
  getAvailableOrders, acceptDelivery, getMyDeliveries, markDelivered,
  updateDeliveryLocation,
  cancelOrder,
} from "../controllers/orderController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// ── CUSTOMER routes — static paths first ─────────────────────
r.post("/",            protect, placeOrder);
r.get("/my",           protect, getMyOrders);

// ── STORE OWNER routes — static paths ────────────────────────
r.get("/store/:storeId",  protect, restrictTo("store"), getStoreOrders);

// ── DELIVERY PARTNER routes — ALL static paths before /:id ───
r.get("/delivery/available", protect, restrictTo("delivery"), getAvailableOrders);
r.get("/delivery/mine",      protect, restrictTo("delivery"), getMyDeliveries);

// ── DYNAMIC path /:id — MUST come after all static paths ─────
r.get("/:id",          protect, getOrderById);

// ── Action sub-routes on /:id ─────────────────────────────────
r.post("/:id/cancel",   protect, restrictTo("customer"),            cancelOrder);
r.post("/:id/accept",   protect, restrictTo("delivery"),            acceptDelivery);
r.put("/:id/status",    protect, restrictTo("store", "delivery"),   updateOrderStatus);
r.put("/:id/location",  protect, restrictTo("delivery"),            updateDeliveryLocation);

// NOTE: markDelivered is handled via updateOrderStatus (PUT /:id/status)
// with { status: "delivered" } — no separate endpoint needed.

export default r;