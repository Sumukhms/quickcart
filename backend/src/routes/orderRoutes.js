/**
 * orderRoutes.js — ADD INVOICE ROUTE
 *
 * Root cause: invoiceController existed but was never imported or registered.
 * The route GET /:id/invoice must come BEFORE the generic GET /:id
 * to avoid Express treating "invoice" as an orderId param.
 *
 * FILE: backend/src/routes/orderRoutes.js
 * MINIMAL CHANGE — add 2 lines only.
 */

import express from "express";
import {
  placeOrder, getMyOrders, getOrderById, updateOrderStatus, getStoreOrders,
  getAvailableOrders, acceptDelivery, getMyDeliveries, markDelivered,
  updateDeliveryLocation,
  cancelOrder,
} from "../controllers/orderController.js";
// ✅ ADD: import invoice controller
import { generateInvoice } from "../controllers/invoiceController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// ── CUSTOMER routes — static paths first ─────────────────────
r.post("/",    protect, placeOrder);
r.get("/my",   protect, getMyOrders);

// ── STORE OWNER routes ────────────────────────────────────────
r.get("/store/:storeId", protect, restrictTo("store"), getStoreOrders);

// ── DELIVERY PARTNER routes — ALL static paths before /:id ───
r.get("/delivery/available", protect, restrictTo("delivery"), getAvailableOrders);
r.get("/delivery/mine",      protect, restrictTo("delivery"), getMyDeliveries);

// ✅ ADD: invoice route BEFORE /:id — any logged-in user can request
// (controller handles authorization: customer=own order, admin=all)
r.get("/:id/invoice", protect, generateInvoice);

// ── DYNAMIC path /:id — MUST come after all static paths ─────
r.get("/:id", protect, getOrderById);

// ── Action sub-routes on /:id ─────────────────────────────────
r.post("/:id/cancel",   protect, restrictTo("customer"),            cancelOrder);
r.post("/:id/accept",   protect, restrictTo("delivery"),            acceptDelivery);
r.put("/:id/status",    protect, restrictTo("store", "delivery"),   updateOrderStatus);
r.put("/:id/location",  protect, restrictTo("delivery"),            updateDeliveryLocation);

export default r;