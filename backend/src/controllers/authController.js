import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// Role-based redirect paths
const ROLE_REDIRECT = {
  customer: "/user/home",
  store: "/store/dashboard",
  delivery: "/delivery/dashboard",
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, vehicleType } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    const validRoles = ["customer", "store", "delivery"];
    const userRole = validRoles.includes(role) ? role : "customer";

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userData = { name, email, password: hashed, role: userRole, phone };
    if (userRole === "delivery" && vehicleType) userData.vehicleType = vehicleType;

    const user = await User.create(userData);
    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleType: user.vehicleType,
      },
      redirectTo: ROLE_REDIRECT[user.role],
    });
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

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        vehicleType: user.vehicleType,
        isAvailable: user.isAvailable,
        storeId: user.storeId,
      },
      redirectTo: ROLE_REDIRECT[user.role],
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = { name: req.body.name, phone: req.body.phone, address: req.body.address };
    if (req.user.role === "delivery") allowedUpdates.vehicleType = req.body.vehicleType;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: allowedUpdates },
      { new: true }
    ).select("-password");
    res.json(user);
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