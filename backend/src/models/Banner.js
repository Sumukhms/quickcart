/**
 * Banner.js
 *
 * Admins create / manage homepage banners via /api/admin/banners.
 * The statsController reads active banners and returns them in
 * the /api/stats/home response.
 */
import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title:  { type: String, required: true, trim: true },
  sub:    { type: String, default: "" },          // sub-heading
  badge:  { type: String, default: "" },          // small chip e.g. "⚡ Express"
  emoji:  { type: String, default: "🎁" },
  cta:    { type: String, default: "Order Now" }, // call-to-action button text
  bg:     { type: String, default: "from-orange-600 via-red-600 to-pink-700" },
  link:   { type: String, default: "/user/home" },
  isActive: { type: Boolean, default: true },
  order:  { type: Number, default: 0 },           // display order
}, { timestamps: true });

export default mongoose.model("Banner", bannerSchema);