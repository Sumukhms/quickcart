import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true
  },

  rating: {
    type: Number,
    default: 0,
    min:0,
    max:5
  },

  isOpen: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

const Store = mongoose.model("Store", storeSchema);

export default Store;