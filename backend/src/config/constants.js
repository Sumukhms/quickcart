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

// ── JWT — Access token (short-lived) ──────────────────────────
export const JWT_EXPIRES_IN          = process.env.JWT_EXPIRES_IN || "15m";

// ── Refresh token ──────────────────────────────────────────────
export const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;

// Cookie name used for the refresh token
export const REFRESH_COOKIE_NAME = "qc_rt";

// Cookie options shared across set/clear operations
export const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge:   REFRESH_TOKEN_EXPIRES_DAYS * 86_400_000, // ms
  path:     "/",
};