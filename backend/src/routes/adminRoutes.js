import express from "express";
import {
  getStats, getUsers, getAllOrders,
  createCoupon, listCoupons, deleteCoupon, toggleCoupon,
  listBanners, createBanner, updateBanner, deleteBanner, toggleBanner,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();
const adminOnly = restrictTo("admin");

r.use(protect, adminOnly);

r.get("/stats",                getStats);
r.get("/users",                getUsers);
r.get("/orders",               getAllOrders);

// Coupons
r.get("/coupons",              listCoupons);
r.post("/coupons",             createCoupon);
r.delete("/coupons/:id",       deleteCoupon);
r.patch("/coupons/:id/toggle", toggleCoupon);

// Banners
r.get("/banners",              listBanners);
r.post("/banners",             createBanner);
r.put("/banners/:id",          updateBanner);
r.delete("/banners/:id",       deleteBanner);
r.patch("/banners/:id/toggle", toggleBanner);

export default r;