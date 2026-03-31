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
} from "../controllers/authController.js";
import {
  registerValidation,
  loginValidation,
  otpValidation,
  resetPasswordValidation,
} from "../middleware/validators.js";
import rateLimit from "express-rate-limit";

const r = express.Router();

// ── Auth-specific rate limiters ────────────────────────────────
// Applied per-route (more granular than the global limiter)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 min
  max: 10,
  message: { message: "Too many login attempts, please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,    // 1 hour
  max: 5,
  message: { message: "Too many registration attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,     // 5 min
  max: 3,
  message: { message: "Too many OTP requests, please wait 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Local auth ─────────────────────────────────────────────────
r.post("/register",             registerLimiter, ...registerValidation,      register);
r.post("/login",                loginLimiter,    ...loginValidation,         login);

// ── Email verification ─────────────────────────────────────────
r.post("/verify-email",         otpLimiter,      ...otpValidation,           verifyEmail);
r.post("/resend-verification",  otpLimiter,      express.json(),             resendVerificationOtp);

// ── Password reset ─────────────────────────────────────────────
r.post("/forgot-password",      otpLimiter,      express.json(),             forgotPassword);
r.post("/reset-password",       otpLimiter,      ...resetPasswordValidation, resetPassword);

// ── Google OAuth ───────────────────────────────────────────────
r.get("/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account"
  })
);
r.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    session: false,
  }),
  googleCallback
);

// ── Protected profile routes ────────────────────────────────────
r.get("/profile",                protect, getProfile);
r.put("/profile",                protect, updateProfile);
r.patch("/availability",         protect, restrictTo("delivery"), toggleDeliveryAvailability);
r.post("/addresses",             protect, addAddress);
r.delete("/addresses/:index",    protect, removeAddress);
r.patch("/addresses/:index/default", protect, setDefaultAddress);

export default r;