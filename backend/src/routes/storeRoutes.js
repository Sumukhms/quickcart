import express from "express";
import { createStore, getStores, getStoreById, updateStore, getMyStore, getStoreAnalytics } from "../controllers/storeController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

r.get("/", getStores);
r.get("/mine", protect, restrictTo("store"), getMyStore);
r.get("/analytics", protect, restrictTo("store"), getStoreAnalytics);
r.get("/:id", getStoreById);
r.post("/", protect, restrictTo("store"), createStore);
r.put("/:id", protect, restrictTo("store"), updateStore);

export default r;