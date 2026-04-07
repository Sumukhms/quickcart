




import express    from "express";
import rateLimit  from "express-rate-limit";
import {
  getStats, getUsers, getAllOrders,
  createCoupon, listCoupons, deleteCoupon, toggleCoupon,
  listBanners, createBanner, updateBanner, deleteBanner, toggleBanner,
  getPendingPayouts, processPayout,
  getPendingRefunds, processRefund,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();
const adminOnly = restrictTo("admin");

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  skip: () => process.env.NODE_ENV === "development",
});

r.use(protect, adminOnly, adminLimiter);

r.get("/stats",                getStats);
r.get("/users",                getUsers);
r.get("/orders",               getAllOrders);

r.get("/coupons",              listCoupons);
r.post("/coupons",             createCoupon);
r.delete("/coupons/:id",       deleteCoupon);
r.patch("/coupons/:id/toggle", toggleCoupon);

r.get("/banners",              listBanners);
r.post("/banners",             createBanner);
r.put("/banners/:id",          updateBanner);
r.delete("/banners/:id",       deleteBanner);
r.patch("/banners/:id/toggle", toggleBanner);

r.get("/payouts",              getPendingPayouts);
r.patch("/payout/:id",         processPayout);

// ✅ ADD:
r.get("/refunds",                   getPendingRefunds);
r.post("/refunds/:orderId/process", processRefund);


export default r;