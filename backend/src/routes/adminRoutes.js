import express from "express";
import {
  getStats, getUsers, getAllOrders,
  createCoupon, listCoupons, deleteCoupon, toggleCoupon,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();
const adminOnly = restrictTo("admin");

r.use(protect, adminOnly);   // all admin routes require admin role

r.get("/stats",            getStats);
r.get("/users",            getUsers);
r.get("/orders",           getAllOrders);
r.get("/coupons",          listCoupons);
r.post("/coupons",         createCoupon);
r.delete("/coupons/:id",   deleteCoupon);
r.patch("/coupons/:id/toggle", toggleCoupon);

export default r;