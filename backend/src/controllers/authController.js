import User         from "../models/User.js";
import Otp          from "../models/Otp.js";
import Cart         from "../models/Cart.js";
import Order        from "../models/Order.js";
import Store        from "../models/Store.js";
import RefreshToken from "../models/RefreshToken.js";
import bcrypt       from "bcryptjs";
import jwt          from "jsonwebtoken";
import crypto       from "crypto";
import { sendOtpEmail, sendWelcomeEmail } from "../services/emailService.js";
import {
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTS,
} from "../config/constants.js";

// ── Helpers ───────────────────────────────────────────────────

/** Sign a short-lived access token (15 min by default) */
const signAccessToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

/**
 * Issue both tokens and set the refresh-token cookie.
 * Returns the raw access token string.
 *
 * family — groups tokens across rotations; allows reuse-attack detection.
 */
const issueTokens = async (user, res, { family, userAgent, ip } = {}) => {
  const accessToken  = signAccessToken(user);
  const rawRefresh   = RefreshToken.generate();
  const tokenFamily  = family || crypto.randomBytes(16).toString("hex");

  await RefreshToken.store(user._id, rawRefresh, tokenFamily, {
    userAgent: userAgent || "",
    ip:        ip        || "",
    expiresInDays: REFRESH_TOKEN_EXPIRES_DAYS,
  });

  res.cookie(REFRESH_COOKIE_NAME, rawRefresh, REFRESH_COOKIE_OPTS);

  return { accessToken, family: tokenFamily };
};

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
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: "Email already registered. Please log in." });
      }
      const otp  = await Otp.createOtp(normalizedEmail, "verify_email");
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
    const otp  = await Otp.createOtp(normalizedEmail, "verify_email");
    const sent = await sendOtpEmail(normalizedEmail, otp, "verify_email");

    if (!sent) {
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

    sendWelcomeEmail(normalizedEmail, user.name).catch(console.error);

    const { accessToken } = await issueTokens(user, res, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.json({
      message:    "Email verified successfully! Welcome to QuickCart.",
      token:      accessToken,
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

    const { accessToken } = await issueTokens(user, res, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    res.json({
      token:      accessToken,
      user:       safeUser(user),
      redirectTo: ROLE_REDIRECT[user.role] || "/user/home",
    });
  } catch (e) {
    console.error("[Login] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// REFRESH — issue a new access token using the http-only cookie
// ─────────────────────────────────────────────────────────────
export const refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!rawToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // Find the stored token record
    const record = await RefreshToken.findValid(rawToken);

    if (!record) {
      // Token not found — it may have been used already (reuse attack).
      // Check if a same-family token was previously issued and revoke everything.
      const hash = RefreshToken.hash(rawToken);
      const anyFamily = await RefreshToken.findOne({ tokenHash: hash }).lean();
      if (anyFamily) {
        await RefreshToken.revokeFamily(anyFamily.family);
        console.warn(`[refresh] Reuse attack detected for family ${anyFamily.family} — all sessions revoked`);
      }

      // Clear the cookie and force re-login
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
      return res.status(401).json({ message: "Invalid or expired refresh token. Please log in again." });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      await record.deleteOne();
      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
      return res.status(401).json({ message: "User not found" });
    }

    // Token rotation — delete old record and issue a new pair with the same family
    const oldFamily = record.family;
    await record.deleteOne();

    const { accessToken } = await issueTokens(user, res, {
      family:    oldFamily,
      userAgent: req.headers["user-agent"],
      ip:        req.ip,
    });

    res.json({
      token: accessToken,
      user:  safeUser(user),
    });
  } catch (e) {
    console.error("[Refresh] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// LOGOUT — invalidate refresh token + clear cookie
// ─────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    if (rawToken) {
      const record = await RefreshToken.findValid(rawToken);
      if (record) await record.deleteOne();
    }

    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.json({ message: "Logged out successfully" });
  } catch (e) {
    console.error("[Logout] Error:", e.message);
    // Still clear the cookie even on error
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.json({ message: "Logged out" });
  }
};

// ─────────────────────────────────────────────────────────────
// LOGOUT ALL SESSIONS
// ─────────────────────────────────────────────────────────────
export const logoutAll = async (req, res) => {
  try {
    // req.user is populated by the protect middleware (access token still valid)
    await RefreshToken.deleteMany({ userId: req.user.userId });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
    res.json({ message: "All sessions logged out" });
  } catch (e) {
    console.error("[LogoutAll] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};

// ─────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || user.authProvider === "google") {
      return res.json({ message: "If that email exists, an OTP has been sent." });
    }

    const otp  = await Otp.createOtp(normalizedEmail, "reset_password");
    const sent = await sendOtpEmail(normalizedEmail, otp, "reset_password");

    if (!sent) {
      console.error(`[ForgotPassword] OTP generated but email failed for ${normalizedEmail}`);
      return res.status(500).json({
        message:
          "OTP was generated but the email could not be sent. " +
          "Please check EMAIL_USER and EMAIL_PASS in your server .env file.",
        emailError: true,
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

    // Invalidate all sessions after password reset for security
    await RefreshToken.deleteMany({ userId: user._id });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });

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
    const user = req.user;
    const { accessToken } = await issueTokens(user, res, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
    const redirectTo  = ROLE_REDIRECT[user.role] || "/user/home";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    // Note: refresh token is in httpOnly cookie; only access token goes in URL fragment
    res.redirect(
      `${frontendUrl}/auth/callback#token=${accessToken}&redirectTo=${encodeURIComponent(redirectTo)}`
    );
  } catch (e) {
    console.error("[GoogleCallback] Error:", e.message);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
};

// ─────────────────────────────────────────────────────────────
// PROFILE MANAGEMENT (unchanged)
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

// ─────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────────────────────
export const deleteAccount = async (req, res) => {
  try {
    const { password, confirmation } = req.body;
    const userId = req.user.userId;

    if (confirmation !== "DELETE") {
      return res.status(400).json({ message: 'Please type "DELETE" exactly to confirm' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.authProvider === "local" && user.password) {
      if (!password) {
        return res.status(400).json({ message: "Password is required to delete your account" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ message: "Incorrect password — account not deleted" });
      }
    }

    // Cancel active orders, clear cart, close store
    await Order.updateMany(
      { userId, status: { $in: ["pending", "confirmed"] } },
      {
        $set:  { status: "cancelled" },
        $push: { statusHistory: { status: "cancelled", timestamp: new Date(), updatedBy: userId } },
      }
    );
    await Cart.findOneAndDelete({ userId });
    if (user.role === "store") {
      await Store.findOneAndUpdate({ ownerId: userId }, { isOpen: false });
    }
    await User.updateMany(
      { favoriteStores: userId },
      { $pull: { favoriteStores: userId } }
    );

    // Revoke all refresh tokens
    await RefreshToken.deleteMany({ userId });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });

    await User.findByIdAndDelete(userId);

    res.json({ message: "Your account has been permanently deleted." });
  } catch (e) {
    console.error("[DeleteAccount] Error:", e.message);
    res.status(500).json({ message: e.message });
  }
};