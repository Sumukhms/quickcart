import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  deliveryAgentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
  }],
  totalPrice: { type: Number, required: true },
  deliveryFee: { type: Number, default: 20 },
  deliveryAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
    default: "pending",
  },
  paymentMethod: { type: String, enum: ["cod", "online"], default: "cod" },
  estimatedTime: { type: String, default: "30-40 min" },
  deliveryLocation: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);