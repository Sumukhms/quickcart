/**
 * NotificationBell.jsx
 *
 * Dropdown notification centre shown in the Navbar.
 * Features:
 *   - Animated badge for unread count
 *   - Scrollable notification list grouped by read/unread
 *   - Mark all read / delete individual
 *   - Click notification → navigate to related order
 *   - Empty state illustration
 */
import { useState, useRef, useEffect } from "react";
import { useNavigate }                  from "react-router-dom";
import { Bell, X, CheckCheck, Trash2, Package, CreditCard, Truck, BellOff } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const TYPE_ICON = {
  order:    { icon: Package,    color: "#f59e0b" },
  payment:  { icon: CreditCard, color: "#22c55e" },
  delivery: { icon: Truck,      color: "#3b82f6" },
  system:   { icon: Bell,       color: "#8b5cf6" },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationItem({ notif, onRead, onDelete, onNavigate }) {
  const cfg  = TYPE_ICON[notif.type] || TYPE_ICON.system;
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.isRead) onRead(notif._id);
    if (notif.refModel === "Order" && notif.refId) {
      onNavigate(`/user/orders/${notif.refId}`);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all"
      style={{
        background: notif.isRead ? "transparent" : "rgba(255,107,53,0.04)",
        borderBottom: "1px solid var(--border)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = notif.isRead ? "transparent" : "rgba(255,107,53,0.04)")}
    >
      {/* Unread dot */}
      {!notif.isRead && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: "var(--brand)" }}
        />
      )}

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: cfg.color + "15" }}
      >
        <Icon size={15} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <p
          className="text-sm font-semibold leading-snug"
          style={{ color: notif.isRead ? "var(--text-secondary)" : "var(--text-primary)" }}
        >
          {notif.title}
        </p>
        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>
          {notif.message}
        </p>
        <p className="text-[10px] mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
        className="absolute right-3 top-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
        title="Delete notification"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl transition-all hover:scale-110 active:scale-95"
        style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black text-white"
            style={{
              background:  "linear-gradient(135deg, #ef4444, #dc2626)",
              boxShadow:   "0 2px 8px rgba(239,68,68,0.5)",
              animation:   "badgeBounce 0.5s ease",
              padding:     "0 3px",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden shadow-2xl border z-50"
          style={{
            width:           "min(380px, 94vw)",
            backgroundColor:"var(--card)",
            borderColor:     "var(--border)",
            boxShadow:       "0 25px 60px rgba(0,0,0,0.45)",
            animation:       "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            transformOrigin: "top right",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={15} style={{ color: "var(--brand)" }} />
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                  title="Mark all as read"
                >
                  <CheckCheck size={11} /> All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg transition-all hover:scale-110"
                style={{ color: "var(--text-muted)", background: "var(--elevated)" }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* List */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "min(480px, 70vh)" }}
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "var(--elevated)" }}
                >
                  <BellOff size={24} style={{ color: "var(--text-muted)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                  No notifications yet
                </p>
                <p className="text-xs text-center max-w-[180px]" style={{ color: "var(--text-muted)" }}>
                  Order updates and delivery alerts will appear here
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif._id}
                  notif={notif}
                  onRead={markRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-4 py-2.5 text-center"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Notifications auto-expire after 30 days
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}