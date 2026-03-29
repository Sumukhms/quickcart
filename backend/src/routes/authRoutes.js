/**
 * authRoutes — UPDATED
 *
 * New routes:
 *   POST   /api/auth/addresses          — add a new address
 *   DELETE /api/auth/addresses/:index   — remove address by index
 *   PATCH  /api/auth/addresses/:index/default — set as default
 */
import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  toggleDeliveryAvailability,
  addAddress,
  removeAddress,
  setDefaultAddress,
} from "../controllers/authController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// Auth
r.post("/register",   register);
r.post("/login",      login);
r.get("/profile",     protect, getProfile);
r.put("/profile",     protect, updateProfile);
r.patch("/availability", protect, restrictTo("delivery"), toggleDeliveryAvailability);

// ── Address management (customers & store owners) ───────────
r.post("/addresses",                 protect, addAddress);
r.delete("/addresses/:index",        protect, removeAddress);
r.patch("/addresses/:index/default", protect, setDefaultAddress);

export default r;