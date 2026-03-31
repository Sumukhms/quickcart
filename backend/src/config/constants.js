/**
 * config.js
 *
 * Single source of truth for all app-level constants.
 * Import from here instead of hardcoding values in controllers.
 *
 * Usage:
 *   import { DELIVERY_FEE, ORDER_CANCELLABLE_STATUSES } from "../config/constants.js";
 */

// ── Delivery ───────────────────────────────────────────────────
export const DELIVERY_FEE = Number(process.env.DELIVERY_FEE) || 20;

// ── Order limits ───────────────────────────────────────────────
export const MAX_CART_ITEMS        = 20;
export const MAX_ORDER_VALUE       = 50_000;     // ₹50,000 per order
export const MIN_ORDER_VALUE       = 1;

// ── Order lifecycle ────────────────────────────────────────────
export const ORDER_CANCELLABLE_STATUSES = ["pending", "confirmed"];
export const DELIVERY_TRIGGER_STATUSES  = ["ready_for_pickup", "packing"];

// ── Pagination defaults ────────────────────────────────────────
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT     = 200;

// ── OTP ────────────────────────────────────────────────────────
export const OTP_EXPIRY_MINUTES = 10;
export const OTP_MAX_ATTEMPTS   = 5;

// ── Rating ────────────────────────────────────────────────────
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// ── Addresses ─────────────────────────────────────────────────
export const MAX_SAVED_ADDRESSES = 5;

// ── Razorpay ──────────────────────────────────────────────────
export const RAZORPAY_CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";

// ── JWT ───────────────────────────────────────────────────────
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";