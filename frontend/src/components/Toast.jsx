import { CheckCircle, XCircle, Info, AlertCircle, X } from "lucide-react";
import { useCart } from "../../context/CartContext";

const icons = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  info: <Info size={18} />,
  warning: <AlertCircle size={18} />,
};

const colors = {
  success: "border-green-500/40 bg-green-500/10 text-green-400",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  info: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  warning: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
};

export default function ToastContainer() {
  const { toasts } = useCart();

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl min-w-[280px] max-w-[360px] pointer-events-auto ${colors[toast.type || "success"]}`}
          style={{ animation: "toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          {icons[toast.type || "success"]}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
