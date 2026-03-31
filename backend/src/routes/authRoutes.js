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

const r = express.Router();

// ── Local auth ────────────────────────────────────────────────
r.post("/register",             ...registerValidation,      register);
r.post("/login",                ...loginValidation,         login);

// ── Email verification ────────────────────────────────────────
r.post("/verify-email",         ...otpValidation,           verifyEmail);
r.post("/resend-verification",  express.json(),             resendVerificationOtp);

// ── Password reset ────────────────────────────────────────────
r.post("/forgot-password",      express.json(),             forgotPassword);
r.post("/reset-password",       ...resetPasswordValidation, resetPassword);

// ── Google OAuth ──────────────────────────────────────────────
r.get("/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account"
  })
);
r.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`, session: false }),
  googleCallback
);

// ── Protected profile routes ──────────────────────────────────
r.get("/profile",                protect, getProfile);
r.put("/profile",                protect, updateProfile);
r.patch("/availability",         protect, restrictTo("delivery"), toggleDeliveryAvailability);
r.post("/addresses",             protect, addAddress);
r.delete("/addresses/:index",    protect, removeAddress);
r.patch("/addresses/:index/default", protect, setDefaultAddress);

export default r;