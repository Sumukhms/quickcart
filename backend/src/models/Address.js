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

// ── Single combined pre-save hook (fixes "next is not a function" error) ──
addressSchema.pre("save", async function () {
  // 1. Enforce max 5 addresses per user on new documents
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ userId: this.userId });
    if (count >= 5) {
      throw new Error("Maximum 5 addresses allowed per account");
    }
  }

  // 2. When setting as default, clear all others for that user
  if (this.isModified("isDefault") && this.isDefault) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

/** Human-readable one-liner (used when saving inside orders) */
addressSchema.methods.toOneLiner = function () {
  const parts = [this.street, this.area, this.city, this.state, this.pincode].filter(Boolean);
  return parts.join(", ");
};

export default mongoose.model("Address", addressSchema);