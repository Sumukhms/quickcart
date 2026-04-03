/**
 * notificationController.js
 *
 * REST handlers for the /api/notifications endpoints.
 *
 * Routes (mounted at /api/notifications):
 *   GET  /              – list notifications for current user (paginated)
 *   GET  /unread-count  – fast unread count badge endpoint
 *   PATCH /:id/read     – mark one notification as read
 *   PATCH /read-all     – mark ALL notifications as read
 *   DELETE /:id         – delete a single notification
 */
import Notification from "../models/Notification.js";

// ── GET /api/notifications ────────────────────────────────────
export const listNotifications = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip  = Number(req.query.skip) || 0;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user.userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      Notification.countDocuments({ userId: req.user.userId }),
      Notification.countDocuments({ userId: req.user.userId, isRead: false }),
    ]);

    res.json({ notifications, total, unreadCount, limit, skip });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── GET /api/notifications/unread-count ──────────────────────
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.userId,
      isRead: false,
    });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json(notification);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.userId, isRead: false },
      { isRead: true }
    );
    res.json({ updated: result.modifiedCount });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user.userId,
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ message: "Notification deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};