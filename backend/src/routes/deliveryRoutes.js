/**
 * deliveryRoutes.js
 *
 * Mount in server.js:
 *   import deliveryRoutes from "./src/routes/deliveryRoutes.js";
 *   app.use("/api/delivery", deliveryRoutes);
 *
 * All routes require delivery role.
 */
import express from "express";
import {
  getEarningsSummary,
  requestPayout,
  getPayoutStatus,
} from "../controllers/deliveryController.js";
import { protect, deliveryOnly } from "../middleware/authMiddleware.js";

const r = express.Router();

r.use(protect, deliveryOnly);

// Earnings summary (used by dashboard wallet card)
r.get("/earnings", getEarningsSummary);

// Payout requests
r.post("/payout/request", requestPayout);
r.get("/payout/status",   getPayoutStatus);

export default r;