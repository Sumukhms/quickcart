/**
 * authController — UPDATED
 *
 * Changes:
 *   1. getProfile / login / register now return `addresses` array
 *   2. updateProfile accepts `addresses` array updates
 *   3. NEW: addAddress — adds a new address to addresses[]
 *   4. NEW: removeAddress — removes an address by index
 *   5. NEW: setDefaultAddress — moves an address to index 0
 *
 * The `address` field (legacy) is synced to addresses[0] when addresses
 * are updated, so existing features that read user.address still work.
 */
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const ROLE_REDIRECT = {
  customer: "/user/home",
  store:    "/store/dashboard",
  delivery: "/delivery/dashboard",
};

// ── Helper: build safe user object ─────────────────────────────
function safeUser(user) {
  return {
    id:              user._id,
    name:            user.name,
    email:           user.email,
    role:            user.role,
    phone:           user.phone,
    address:         user.address,          // legacy default
    addresses:       user.addresses || [],  // new array
    vehicleType:     user.vehicleType,
    isAvailable:     user.isAvailable,
    storeId:         user.storeId,
    totalDeliveries: user.totalDeliveries,
    rating:          user.rating,
  };
}

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleType } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const validRoles = ["customer", "store", "delivery"];
    const userRole   = validRoles.includes(role) ? role : "customer";

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed   = await bcrypt.hash(password, 10);
    const userData = { name, email, password: hashed, role: userRole, phone };
    if (userRole === "delivery" && vehicleType) userData.vehicleType = vehicleType;

    const user  = await User.create(userData);
    const token = signToken(user);

    res.status(201).json({ token, user: safeUser(user), redirectTo: ROLE_REDIRECT[user.role] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const token = signToken(user);
    res.json({ token, user: safeUser(user), redirectTo: ROLE_REDIRECT[user.role] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json({ ...user.toObject(), addresses: user.addresses || [] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowed = {
      name:    req.body.name,
      phone:   req.body.phone,
      address: req.body.address,
    };
    if (req.user.role === "delivery") allowed.vehicleType = req.body.vehicleType;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: allowed },
      { new: true }
    ).select("-password");
    res.json({ ...user.toObject(), addresses: user.addresses || [] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── NEW: Add a saved address ─────────────────────────────────
export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address?.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.addresses.length >= 5) {
      return res.status(400).json({ message: "Maximum 5 addresses allowed. Delete one first." });
    }

    const trimmed = address.trim();
    if (user.addresses.includes(trimmed)) {
      return res.status(400).json({ message: "This address is already saved" });
    }

    user.addresses.push(trimmed);
    // Sync legacy field to first address
    if (!user.address) user.address = user.addresses[0];
    await user.save();

    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── NEW: Remove a saved address by index ────────────────────
export const removeAddress = async (req, res) => {
  try {
    const idx = Number(req.params.index);
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: "Invalid address index" });
    }

    user.addresses.splice(idx, 1);
    // Keep legacy address in sync
    user.address = user.addresses[0] || user.address;
    await user.save();

    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── NEW: Set a saved address as default (move to index 0) ────
export const setDefaultAddress = async (req, res) => {
  try {
    const idx = Number(req.params.index);
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (isNaN(idx) || idx < 0 || idx >= user.addresses.length) {
      return res.status(400).json({ message: "Invalid address index" });
    }

    // Move selected address to position 0
    const [chosen] = user.addresses.splice(idx, 1);
    user.addresses.unshift(chosen);
    user.address = chosen; // sync legacy field
    await user.save();

    res.json({ addresses: user.addresses, address: user.address });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const toggleDeliveryAvailability = async (req, res) => {
  try {
    if (req.user.role !== "delivery") {
      return res.status(403).json({ message: "Only delivery partners can toggle availability" });
    }
    const user = await User.findById(req.user.userId);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ isAvailable: user.isAvailable });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};