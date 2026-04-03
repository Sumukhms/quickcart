/**
 * NotificationContext.jsx
 *
 * Provides notification state + actions to the whole app.
 *
 * Responsibilities:
 *   1. Loads existing notifications on mount (REST API)
 *   2. Listens to Socket.IO "notification" events → prepend to list
 *   3. Shows a toast for every incoming real-time notification
 *   4. Exposes markRead / markAllRead / deleteNotification actions
 *   5. Joins "user_<userId>" socket room so the backend can target us
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth }   from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useCart }   from "./CartContext";   // for addToast
import api           from "../api/api";

const NotificationContext = createContext(null);

// ── Type → emoji mapping for toasts ──────────────────────────
const TYPE_EMOJI = {
  order:    "📦",
  payment:  "💳",
  delivery: "🛵",
  system:   "🔔",
};

export function NotificationProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const { emit, on }         = useSocket();
  const { addToast }         = useCart();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const mountedRef = useRef(true);

  // ── Fetch initial notifications ───────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", { params: { limit: 30 } });
      if (!mountedRef.current) return;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // non-critical — silent fail
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    mountedRef.current = true;
    if (isLoggedIn) fetchNotifications();
    else {
      setNotifications([]);
      setUnreadCount(0);
    }
    return () => { mountedRef.current = false; };
  }, [isLoggedIn, fetchNotifications]);

  // ── Join user-specific socket room ────────────────────────
  // Backend emits to "user_<userId>" room
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const userId = user.id || user._id;
    if (userId) emit("join_user_room", userId.toString());
  }, [isLoggedIn, user, emit]);

  // ── Listen for incoming real-time notifications ───────────
  useEffect(() => {
    if (!isLoggedIn) return;

    const unsub = on("notification", (notif) => {
      if (!mountedRef.current) return;

      // Prepend to list
      setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
      setUnreadCount((c) => c + 1);

      // Show toast
      const emoji = TYPE_EMOJI[notif.type] || "🔔";
      addToast(`${emoji} ${notif.title}`, notif.type === "order" ? "info" : "success");
    });

    return () => { if (typeof unsub === "function") unsub(); };
  }, [isLoggedIn, on, addToast]);

  // ── Mark single as read ───────────────────────────────────
  const markRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      // revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((c) => c + 1);
    }
  }, []);

  // ── Mark all as read ──────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch("/notifications/read-all");
    } catch {
      fetchNotifications(); // revert via re-fetch
    }
  }, [fetchNotifications]);

  // ── Delete notification ───────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    const removed = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      if (removed) setNotifications((prev) => [removed, ...prev]);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllRead,
        deleteNotification,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};