import express from "express";
import { submitRating } from "../controllers/ratingController.js";
import { protect, customerOnly } from "../middleware/authMiddleware.js";

const r = express.Router();

// POST /api/ratings/rate — authenticated customers only
r.post("/rate", protect, customerOnly, submitRating);

export default r;