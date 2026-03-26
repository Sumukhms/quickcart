import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  category: { type: String, required: true, enum: ["Groceries", "Food", "Snacks", "Beverages", "Medicines", "Other"] },
  image: { type: String, default: "" },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
  deliveryTime: { type: String, default: "20-30 min" },
  minOrder: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Store", storeSchema);