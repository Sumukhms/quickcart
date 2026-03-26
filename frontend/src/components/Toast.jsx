import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";
import { useCart } from "../context/CartContext";

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertCircle size={18} />,
};

const styles = {
  success: { border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)", color: "#22c55e" },
  error: { border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444" },
  info: { border: "1px solid rgba(59,130,246,0.3)", background: "rgba(59,130,246,0.08)", color: "#3b82f6" },
  warning: { border: "1px solid rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)", color: "#f59e0b" },
};

export default function ToastContainer() {
  const { toasts } = useCart();

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const type = toast.type || "success";
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl min-w-[280px] max-w-[360px] pointer-events-auto"
            style={{
              ...styles[type],
              animation: "toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
              backgroundColor: "var(--surface)",
            }}
          >
            <span style={{ color: styles[type].color }}>{icons[type]}</span>
            <span className="text-sm font-medium flex-1" style={{ color: "var(--text-primary)" }}>
              {toast.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}