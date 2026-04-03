import express   from "express";
import passport  from "../config/passport.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import {
  register, login, getProfile, updateProfile,
  verifyEmail, resendVerificationOtp,
  forgotPassword, resetPassword,
  googleCallback,
  addAddress, removeAddress, setDefaultAddress,
  toggleDeliveryAvailability,
  deleteAccount,
  // NEW
  refresh, logout, logoutAll,
} from "../controllers/authController.js";
import {
  registerValidation,
  loginValidation,
  otpValidation,
  resetPasswordValidation,
} from "../middleware/validators.js";
import rateLimit from "express-rate-limit";

const r = express.Router();

const isDev = process.env.NODE_ENV === "development";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  message: { message: "Too many login attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 1000 : 5,
  message: { message: "Too many registration attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 1000 : 5,
  message: { message: "Too many OTP requests, please wait 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limit for token refresh — called automatically by the frontend
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30,
  message: { message: "Too many refresh requests." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
});

// ── Local auth ─────────────────────────────────────────────────
r.post("/register",            registerLimiter, ...registerValidation,      register);
r.post("/login",               loginLimiter,    ...loginValidation,         login);

// ── Token management ───────────────────────────────────────────
// POST /refresh — no auth middleware (access token may be expired)
r.post("/refresh",             refreshLimiter,  refresh);
// POST /logout — no auth required (cookie is enough to identify session)
r.post("/logout",                               logout);
// POST /logout-all — requires valid access token to identify the user
r.post("/logout-all",          protect,         logoutAll);

// ── Email verification ─────────────────────────────────────────
r.post("/verify-email",        otpLimiter,      ...otpValidation,           verifyEmail);
r.post("/resend-verification", otpLimiter,      resendVerificationOtp);

// ── Password reset ─────────────────────────────────────────────
r.post("/forgot-password",     otpLimiter,      forgotPassword);
r.post("/reset-password",      otpLimiter,      ...resetPasswordValidation, resetPassword);

// ── Google OAuth ───────────────────────────────────────────────
r.get("/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);
r.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`,
    session: false,
  }),
  googleCallback
);

// ── Protected profile routes ───────────────────────────────────
r.get("/profile",                    protect, getProfile);
r.put("/profile",                    protect, updateProfile);
r.patch("/availability",             protect, restrictTo("delivery"), toggleDeliveryAvailability);
r.post("/addresses",                 protect, addAddress);
r.delete("/addresses/:index",        protect, removeAddress);
r.patch("/addresses/:index/default", protect, setDefaultAddress);

// ── Account deletion ───────────────────────────────────────────
r.delete("/account",                 protect, deleteAccount);

export default r;