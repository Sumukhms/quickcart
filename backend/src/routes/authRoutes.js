import express from "express";
import { register, login, getProfile, updateProfile, toggleDeliveryAvailability } from "../controllers/authController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const r = express.Router();
r.post("/register", register);
r.post("/login",    login);
r.get("/profile",   protect, getProfile);
r.put("/profile",   protect, updateProfile);
r.patch("/availability", protect, restrictTo("delivery"), toggleDeliveryAvailability);

export default r;