import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";
import { useCart } from "../context/CartContext";

const icons = {
  success: <CheckCircle size={18} />,
  error:   <XCircle size={18} />,
  info:    <Info size={18} />,
  warning: <AlertCircle size={18} />,
};

const styles = {
  success: { accent: "#22c55e", bg: "rgba(22,197,94,0.08)",  border: "rgba(34,197,94,0.25)" },
  error:   { accent: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.25)" },
  info:    { accent: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
  warning: { accent: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
};

const emojis = {
  success: "✅", error: "❌", info: "ℹ️", warning: "⚠️"
};

export default function ToastContainer() {
  const { toasts } = useCart();

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none" style={{ maxWidth: "380px" }}>
      {toasts.map((toast, i) => {
        const type = toast.type || "success";
        const s = styles[type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl backdrop-blur-xl pointer-events-auto w-full"
            style={{
              background: "var(--card)",
              border: `1px solid ${s.border}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${s.border}`,
              animation: "toastIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Left accent bar */}
            <div
              className="w-1 h-8 rounded-full flex-shrink-0"
              style={{ background: s.accent }}
            />

            {/* Icon */}
            <span style={{ color: s.accent, flexShrink: 0 }}>
              {icons[type]}
            </span>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {toast.message}
              </p>
            </div>

            {/* Progress bar at bottom */}
            <div
              className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl"
              style={{
                background: s.accent,
                width: "100%",
                opacity: 0.4,
                animation: "progressBar 3.5s linear forwards",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}