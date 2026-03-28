import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  rating:  { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

// One rating per user per order (prevents double-submission)
ratingSchema.index({ userId: 1, orderId: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);