import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true
  },

  description: {
    type: String
  },

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  image: {
    type: String
  },

  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },

  available: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;