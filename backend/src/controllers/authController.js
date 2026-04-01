/**
 * authController.js — FIXED
 *
 * Fixes:
 *   1. register: properly handles existing-but-unverified accounts
 *      (resends OTP instead of throwing "already registered" error)
 *   2. login: normalizes email before lookup
 *   3. verifyEmail: clears all existing OTPs for same email on success
 *   4. forgotPassword: normalizes email
 *   5. googleCallback: handles missing FRONTEND_URL gracefully
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
    favoriteStores:  user.favoriteStores || [],
  };
}

// ─────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleType } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const validRoles = ["customer", "store", "delivery"];
    const userRole   = validRoles.includes(role) ? role : "customer";

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // If already verified → error
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: "Email already registered. Please log in." });
      }
      // If unverified → resend OTP (don't error out)
      const otp = await Otp.createOtp(normalizedEmail, "verify_email");
      const sent = await sendOtpEmail(normalizedEmail, otp, "verify_email");
      if (!sent) {
        return res.status(500).json({
          message: "Account exists but we could not send the OTP email. Check your EMAIL_USER and EMAIL_PASS in .env",
        });
      }
      return res.status(200).json({
        message:              "A new verification OTP has been sent to your email.",
        email:                normalizedEmail,
        requiresVerification: true,
      });
    }

    const hashed   = await bcrypt.hash(password, 12);
    const userData = {
      name:            name?.trim(),
      email:           normalizedEmail,
      password:        hashed,
      role:            userRole,
      phone:           phone?.trim() || undefined,
      isEmailVerified: false,
      authProvider:    "local",
    };
    if (userRole === "delivery" && vehicleType) userData.vehicleType = vehicleType;

    const user = await User.create(userData);

    // Generate OTP and send email
    const otp  = await Otp.createOtp(normalizedEmail, "verify_email");
    const sent = await sendOtpEmail(normalizedEmail, otp, "verify_email");

    if (!sent) {
      // Created account but email failed — tell the user clearly
      // Don't delete the account; they can request a resend
      console.error(`[Register] Account created for ${normalizedEmail} but OTP email failed to send.`);
      return res.status(201).json({
        message:              "Account created! However, we could not send the OTP email. Please check server EMAIL configuration and use 'Resend OTP'.",
        email:                normalizedEmail,
        requiresVerification: true,
        emailError:           true,
      });
    }

    res.status(201).json({
      message:              "Registration successful. Please check your email for the OTP.",
      email:                normalizedEmail,
      requiresVerification: true,
    });
  } catch (e) {
    console.error("[Register] Error:", e.message);
    // Handle MongoDB duplicate key error
    if (e.code === 11000) {
      return res.status(400).json({ message: "Email already registered. Please log in." });
    }
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    const result = await Otp.verifyOtp(normalizedEmail, otp, "verify_email");
    if (!result.valid) {
      return res.status(400).json({ message: result.reason });
    }

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isEmailVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(normalizedEmail, user.name).catch(console.error);

    const token = signToken(user);
    res.json({
      message:    "Email verified successfully! Welcome to QuickCart.",
      token,
      user:       safeUser(user),
      redirectTo: ROLE_REDIRECT[user.role] || "/user/home",
    });
  } catch (e) {
    console.error("[VerifyEmail] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// RESEND VERIFICATION OTP
// ─────────────────────────────────────────────────────────────
export const resendVerificationOtp = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.toLowerCase().trim();
    if (!normalizedEmail) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user)                return res.status(404).json({ message: "Account not found" });
    if (user.isEmailVerified) return res.status(400).json({ message: "Email is already verified" });

    const otp  = await Otp.createOtp(normalizedEmail, "verify_email");
    const sent = await sendOtpEmail(normalizedEmail, otp, "verify_email");

    if (!sent) {
      return res.status(500).json({
        message: "Failed to send OTP email. Please check server EMAIL configuration.",
      });
    }

    res.json({ message: "Verification OTP sent. Please check your email." });
  } catch (e) {
    console.error("[ResendOtp] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:              "Please verify your email before logging in.",
        requiresVerification: true,
        email:                user.email,
      });
    }

    const token = signToken(user);
    res.json({
      token,
      user:       safeUser(user),
      redirectTo: ROLE_REDIRECT[user.role] || "/user/home",
    });
  } catch (e) {
    console.error("[Login] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Always return 200 to prevent email enumeration
    if (!user || user.authProvider === "google") {
      return res.json({
        message: "If that email exists, an OTP has been sent.",
      });
    }

    const otp  = await Otp.createOtp(normalizedEmail, "reset_password");
    const sent = await sendOtpEmail(normalizedEmail, otp, "reset_password");

    if (!sent) {
      return res.status(500).json({
        message: "Failed to send OTP email. Please check server EMAIL configuration.",
      });
    }

    res.json({ message: "If that email exists, an OTP has been sent." });
  } catch (e) {
    console.error("[ForgotPassword] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    const result = await Otp.verifyOtp(normalizedEmail, otp, "reset_password");
    if (!result.valid) {
      return res.status(400).json({ message: result.reason });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { password: hashed },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (e) {
    console.error("[ResetPassword] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// GOOGLE OAUTH CALLBACK
// ─────────────────────────────────────────────────────────────
export const googleCallback = async (req, res) => {
  try {
    const user  = req.user;
    const token = signToken(user);
    const redirectTo = ROLE_REDIRECT[user.role] || "/user/home";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    res.redirect(
      `${frontendUrl}/auth/callback#token=${token}&redirectTo=${encodeURIComponent(redirectTo)}`
    );
  } catch (e) {
    console.error("[GoogleCallback] Error:", e.message);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

// ─────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT
// ─────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ ...user.toObject(), addresses: user.addresses || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateProfile = async (req, res) => {
  try {
    const allowed = {
      name:    req.body.name?.trim(),
      phone:   req.body.phone?.trim(),
      address: req.body.address?.trim(),
    };
    if (req.user.role === "delivery") allowed.vehicleType = req.body.vehicleType;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: allowed },
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
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
    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: "Invalid address index" });
    }
    user.addresses.splice(idx, 1);
    user.address = user.addresses[0] || "";
    await user.save();
    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const idx  = Number(req.params.index);
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: "Invalid address index" });
    }
    const [chosen] = user.addresses.splice(idx, 1);
    user.addresses.unshift(chosen);
    user.address = chosen;
    await user.save();
    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const toggleDeliveryAvailability = async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Delivery partners only" });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ isAvailable: user.isAvailable });
  } catch (e) { res.status(500).json({ message: e.message }); }
};