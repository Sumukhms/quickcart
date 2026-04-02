/**
 * Address.js
 *
 * Structured address document linked to a user.
 * Replaces the plain-string addresses[] on User.
 * Each user can have up to 5 saved addresses.
 *
 * Fields:
 *   userId    – owner
 *   label     – "Home" | "Work" | "Other" (display name)
 *   street    – flat/building + street
 *   area      – locality / neighbourhood
 *   city      – city name
 *   state     – state name
 *   pincode   – 6-digit PIN
 *   landmark  – optional nearby landmark
 *   lat/lng   – from GPS auto-fill (optional)
 *   isDefault – only one per user can be true
 */
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    label: {
      type:    String,
      enum:    ["Home", "Work", "Other"],
      default: "Home",
    },
    street: { type: String, required: true, trim: true },
    area:   { type: String, default: "",    trim: true },
    city:   { type: String, required: true, trim: true },
    state:  { type: String, required: true, trim: true },
    pincode: {
      type:     String,
      required: true,
      trim:     true,
      match:    [/^\d{6}$/, "Pincode must be exactly 6 digits"],
    },
    landmark: { type: String, default: "", trim: true },
    lat:      { type: Number, default: null },
    lng:      { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Enforce max 5 addresses per user (pre-save hook)
addressSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ userId: this.userId });
    if (count >= 5) {
      return next(new Error("Maximum 5 addresses allowed per account"));
    }
  }
  next();
});

// When one address is set as default, clear all others for that user
addressSchema.pre("save", async function (next) {
  if (this.isModified("isDefault") && this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

/** Human-readable one-liner (used when saving inside orders) */
addressSchema.methods.toOneLiner = function () {
  const parts = [this.street, this.area, this.city, this.state, this.pincode].filter(Boolean);
  return parts.join(", ");
};

export default mongoose.model("Address", addressSchema);