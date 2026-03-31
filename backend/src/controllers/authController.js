/**
 * authController.js — UPDATED
 *
 * New endpoints:
 *   POST /api/auth/register              → register + send verification OTP
 *   POST /api/auth/verify-email          → verify OTP, activate account
 *   POST /api/auth/resend-verification   → resend verification OTP
 *   POST /api/auth/forgot-password       → send password-reset OTP
 *   POST /api/auth/verify-reset-otp      → verify reset OTP (dry-run)
 *   POST /api/auth/reset-password        → verify OTP + set new password
 *
 * Existing endpoints updated:
 *   POST /api/auth/login                 → blocks unverified accounts
 *   GET  /api/auth/google                → Google OAuth entry
 *   GET  /api/auth/google/callback       → Google OAuth callback
 */
import User  from "../models/User.js";
import Otp   from "../models/Otp.js";
import bcrypt from "bcryptjs";
import jwt    from "jsonwebtoken";
import { sendOtpEmail, sendWelcomeEmail } from "../services/emailService.js";

// ── Helpers ───────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const ROLE_REDIRECT = {
  customer: "/user/home",
  store:    "/store/dashboard",
  delivery: "/delivery/dashboard",
  admin:    "/admin",
};

function safeUser(user) {
  return {
    id:              user._id,
    name:            user.name,
    email:           user.email,
    role:            user.role,
    phone:           user.phone,
    address:         user.address,
    addresses:       user.addresses || [],
    isEmailVerified: user.isEmailVerified,
    authProvider:    user.authProvider,
    avatar:          user.avatar,
    vehicleType:     user.vehicleType,
    isAvailable:     user.isAvailable,
    storeId:         user.storeId,
    totalDeliveries: user.totalDeliveries,
    rating:          user.rating,
  };
}

// ─────────────────────────────────────────────────────────────
// REGISTER — creates unverified account, sends OTP
// ─────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleType } = req.body;

    const validRoles = ["customer", "store", "delivery"];
    const userRole   = validRoles.includes(role) ? role : "customer";

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed   = await bcrypt.hash(password, 12);  // cost 12 for production
    const userData = {
      name, email,
      password: hashed,
      role: userRole,
      phone,
      isEmailVerified: false,
      authProvider:    "local",
    };
    if (userRole === "delivery" && vehicleType) userData.vehicleType = vehicleType;

    const user = await User.create(userData);

    // Generate OTP and send email
    const otp = await Otp.createOtp(email, "verify_email");
    await sendOtpEmail(email, otp, "verify_email");

    res.status(201).json({
      message:            "Registration successful. Please verify your email.",
      email,
      requiresVerification: true,
    });
  } catch (e) {
    console.error("Register error:", e);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const result = await Otp.verifyOtp(email, otp, "verify_email");
    if (!result.valid) {
      return res.status(400).json({ message: result.reason });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send welcome email (non-blocking — don't await)
    sendWelcomeEmail(email, user.name).catch(console.error);

    const token = signToken(user);
    res.json({
      message:    "Email verified successfully!",
      token,
      user:       safeUser(user),
      redirectTo: ROLE_REDIRECT[user.role],
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// RESEND VERIFICATION OTP
// ─────────────────────────────────────────────────────────────
export const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user)              return res.status(404).json({ message: "Account not found" });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email is already verified" });

    const otp = await Otp.createOtp(email, "verify_email");
    await sendOtpEmail(email, otp, "verify_email");

    res.json({ message: "Verification OTP resent. Please check your email." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// LOGIN — blocks unverified local accounts
// ─────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Google-only accounts have no password
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message: "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    const match = await bcrypt.compare(password, user.password || "");
    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Block unverified local accounts
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:              "Please verify your email before logging in.",
        requiresVerification: true,
        email:                user.email,
      });
    }

    const token = signToken(user);
    res.json({ token, user: safeUser(user), redirectTo: ROLE_REDIRECT[user.role] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD — send OTP to email
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always return 200 to prevent email enumeration attacks
    if (!user || user.authProvider === "google") {
      return res.json({
        message: "If that email exists, an OTP has been sent.",
      });
    }

    const otp = await Otp.createOtp(email, "reset_password");
    await sendOtpEmail(email, otp, "reset_password");

    res.json({ message: "If that email exists, an OTP has been sent." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD — verify OTP + update password
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    const result = await Otp.verifyOtp(email, otp, "reset_password");
    if (!result.valid) {
      return res.status(400).json({ message: result.reason });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.findOneAndUpdate(
      { email },
      { password: hashed },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GOOGLE OAUTH CALLBACK — called by Passport after consent
// ─────────────────────────────────────────────────────────────
export const googleCallback = async (req, res) => {
  try {
    const user  = req.user;  // set by passport strategy
    const token = signToken(user);

    // Redirect to frontend with token in URL fragment (not query string)
    // Frontend reads it once and stores in localStorage
    const redirectTo = ROLE_REDIRECT[user.role] || "/user/home";
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback#token=${token}&redirectTo=${encodeURIComponent(redirectTo)}`
    );
  } catch (e) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// ─────────────────────────────────────────────────────────────
// Unchanged endpoints (getProfile, updateProfile, etc.)
// ─────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json({ ...user.toObject(), addresses: user.addresses || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateProfile = async (req, res) => {
  try {
    const allowed = { name: req.body.name, phone: req.body.phone, address: req.body.address };
    if (req.user.role === "delivery") allowed.vehicleType = req.body.vehicleType;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: allowed },
      { new: true }
    ).select("-password");
    res.json({ ...user.toObject(), addresses: user.addresses || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address?.trim()) return res.status(400).json({ message: "Address is required" });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.addresses.length >= 5) return res.status(400).json({ message: "Maximum 5 addresses allowed" });
    const trimmed = address.trim();
    if (user.addresses.includes(trimmed)) return res.status(400).json({ message: "Address already saved" });
    user.addresses.push(trimmed);
    if (!user.address) user.address = user.addresses[0];
    await user.save();
    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const removeAddress = async (req, res) => {
  try {
    const idx  = Number(req.params.index);
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) return res.status(400).json({ message: "Invalid address index" });
    user.addresses.splice(idx, 1);
    user.address = user.addresses[0] || user.address;
    await user.save();
    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const idx  = Number(req.params.index);
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) return res.status(400).json({ message: "Invalid address index" });
    const [chosen] = user.addresses.splice(idx, 1);
    user.addresses.unshift(chosen);
    user.address = chosen;
    await user.save();
    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const toggleDeliveryAvailability = async (req, res) => {
  try {
    if (req.user.role !== "delivery") return res.status(403).json({ message: "Delivery partners only" });
    const user = await User.findById(req.user.userId);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ isAvailable: user.isAvailable });
  } catch (e) { res.status(500).json({ message: e.message }); }
};