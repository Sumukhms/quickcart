/**
 * ratingRoutes.js  — UPDATED
 *
 * Added:
 *   POST /api/ratings/delivery  — rate the delivery partner
 */
import express from "express";
import { submitRating, submitDeliveryRating } from "../controllers/ratingController.js";
import { protect, customerOnly } from "../middleware/authMiddleware.js";

const r = express.Router();

// POST /api/ratings/rate        — rate the store
r.post("/rate",     protect, customerOnly, submitRating);

// POST /api/ratings/delivery    — rate the delivery agent (NEW)
r.post("/delivery", protect, customerOnly, submitDeliveryRating);

export default r;