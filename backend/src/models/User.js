import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "store", "delivery"], default: "customer" },
  phone: { type: String },
  address: { type: String },
  avatar: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);