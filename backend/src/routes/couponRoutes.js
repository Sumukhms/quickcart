import express from "express";
import { validateCoupon, createCoupon, listCoupons } from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";

const r = express.Router();

r.post("/validate", protect, validateCoupon);
r.get("/", protect, listCoupons);
r.post("/", protect, createCoupon); // admin only in real app

export default r;