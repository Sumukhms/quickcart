/**
 * favoriteRoutes.js
 *
 * POST /api/favorites/toggle   — add or remove a store from favorites
 * GET  /api/favorites          — get all favorite stores (populated)
 *
 * Both routes require customer auth.
 */
import express from "express";
import { toggleFavorite, getFavorites } from "../controllers/favoriteController.js";
import { protect, customerOnly } from "../middleware/authMiddleware.js";

const r = express.Router();

r.post("/toggle", protect, customerOnly, toggleFavorite);
r.get("/",        protect, customerOnly, getFavorites);

export default r;