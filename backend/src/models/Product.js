import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  category: { type: String, required: true },
  image: { type: String, default: "" },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  available: { type: Boolean, default: true },
  stock: { type: Number, default: 100 },
  unit: { type: String, default: "piece" },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);