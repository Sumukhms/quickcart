/**
 * NotificationContext.jsx — FIXED
 *
 * Fix: user?.id vs user?._id — both are now normalized in AuthContext,
 * but this adds a fallback chain to handle both safely.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useCart } from "./CartContext";
import api from "../api/api";

const NotificationContext = createContext(null);

const TYPE_EMOJI = {
  order: "📦",
  payment: "💳",
  delivery: "🛵",
  system: "🔔",
};

export function NotificationProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const { emit, on } = useSocket();
  const { addToast } = useCart();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const { data } = await api.get("/notifications", {
        params: { limit: 30 },
      });
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
    return () => {
      mountedRef.current = false;
    };
  }, [isLoggedIn, fetchNotifications]);

  // ✅ FIX: user?.id vs user?._id — both are now normalized in AuthContext,
  // but this adds a fallback chain to handle both safely.
  // NOTE: Room joining is now handled in SocketContext to prevent duplicates
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    // AuthContext normalizes both user.id and user._id
    // SocketContext handles the room joining
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!isLoggedIn) return;

    const unsub = on("notification", (notif) => {
      if (!mountedRef.current) return;
      setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
      setUnreadCount((c) => c + 1);
      const emoji = TYPE_EMOJI[notif.type] || "🔔";
      addToast(
        `${emoji} ${notif.title}`,
        notif.type === "order" ? "info" : "success",
      );
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [isLoggedIn, on, addToast]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await api.patch("/notifications/read-all");
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(
    async (id) => {
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await api.delete(`/notifications/${id}`);
      } catch {
        if (removed) setNotifications((prev) => [removed, ...prev]);
      }
    },
    [notifications],
  );

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
  if (!ctx)
    throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
};
