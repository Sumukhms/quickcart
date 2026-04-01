/**
 * storeCouponRoutes.js
 * Mount in server.js: app.use("/api/store-coupons", storeCouponRoutes);
 */
import express from "express";
import {
  listStoreCoupons,
  createStoreCoupon,
  toggleStoreCoupon,
  deleteStoreCoupon,
} from "../controllers/storeCouponController.js";
import { protect, storeOnly } from "../middleware/authMiddleware.js";

const r = express.Router();

r.use(protect, storeOnly);   // all routes require store role

r.get("/",                 listStoreCoupons);
r.post("/",                createStoreCoupon);
r.patch("/:id/toggle",    toggleStoreCoupon);
r.delete("/:id",           deleteStoreCoupon);

export default r;