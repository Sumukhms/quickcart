/**
 * notificationRoutes.js
 *
 * Mount in server.js:
 *   import notificationRoutes from "./src/routes/notificationRoutes.js";
 *   app.use("/api/notifications", notificationRoutes);
 */
import express from "express";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const r = express.Router();

// All notification routes require authentication
r.use(protect);

r.get("/",                 listNotifications);
r.get("/unread-count",     getUnreadCount);
r.patch("/read-all",       markAllAsRead);
r.patch("/:id/read",       markAsRead);
r.delete("/:id",           deleteNotification);

export default r;