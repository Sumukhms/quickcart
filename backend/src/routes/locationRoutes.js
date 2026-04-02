/**
 * locationRoutes.js
 * File: backend/src/routes/locationRoutes.js
 *
 * Mount in server.js:
 *   import locationRoutes from "./src/routes/locationRoutes.js";
 *   app.use("/api/location", locationRoutes);
 */

import express from "express";
import {
  updateDeliveryLocation,
  getDeliveryLocation,
} from "../controllers/locationController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();

// Delivery partner pushes their GPS coordinates
r.post(
  "/:orderId",
  protect,
  restrictTo("delivery"),
  updateDeliveryLocation
);

// Customer or any authenticated user polls the latest location
r.get(
  "/:orderId",
  protect,
  getDeliveryLocation
);

export default r;