import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  // Category is flexible — store owner defines it (e.g. "Starters", "Main Course", "Dairy", etc.)
  category: { type: String, required: true },
  image: { type: String, default: "" },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 100 },
  unit: { type: String, default: "" }, // e.g. "500ml", "1kg", "1 plate", "serves 2"
  isVeg: { type: Boolean, default: true }, // useful for food stores
  spiceLevel: { type: String, enum: ["mild", "medium", "hot", ""], default: "" },
  prepTime: { type: String, default: "" }, // e.g. "15 min" for food items
}, { timestamps: true });

export default mongoose.model("Product", productSchema);