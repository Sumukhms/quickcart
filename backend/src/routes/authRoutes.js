import express from "express";
import { register, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
const r = express.Router();
r.post("/register", register);
r.post("/login", login);
r.get("/profile", protect, getProfile);
r.put("/profile", protect, updateProfile);
export default r;