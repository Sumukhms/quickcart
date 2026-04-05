// ============================================================
// FILE: backend/src/routes/storeRoutes.js
// FIX: Allow admin to access analytics endpoint
// ============================================================

import express from "express";
import { createStore, getStores, getStoreById, updateStore, getMyStore, getStoreAnalytics } from "../controllers/storeController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

r.get("/", getStores);
r.get("/mine", protect, restrictTo("store"), getMyStore);
// ✅ FIX: allow both store owners AND admins to access analytics
r.get("/analytics", protect, restrictTo("store", "admin"), getStoreAnalytics);
r.get("/:id", getStoreById);
r.post("/", protect, restrictTo("store"), createStore);
r.put("/:id", protect, restrictTo("store"), updateStore);

export default r;