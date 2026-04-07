import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // optional: Google-only users have no password
    role: {
      type: String,
      enum: ["customer", "store", "delivery", "admin"],
      default: "customer",
    },

    // ── Auth & verification ────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },

    // ── Profile ────────────────────────────────────────────
    phone: { type: String },
    address: { type: String },
    addresses: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 addresses allowed",
      },
    },
    favoriteStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
    avatar: { type: String, default: "" },

    // ── Delivery partner ───────────────────────────────────
    vehicleType: {
      type: String,
      enum: ["bike", "cycle", "scooter", ""],
      default: "",
    },
    isAvailable: { type: Boolean, default: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },

    // ── Store owner ────────────────────────────────────────
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },

    // ── Stats ──────────────────────────────────────────────
    totalDeliveries: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
