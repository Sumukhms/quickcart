import { useState, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Check,
  X,
  CreditCard,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { adminAPI } from "../../../api/api";
import { REFUND_STATUS_COLORS } from "../constants/adminConstants";

export function RefundsTab({ addToast }) {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getRefunds({ status: filter });
      setRefunds(data.orders || []);
    } catch (e) {
      addToast(e.response?.data?.message || "Failed to load refunds", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, [filter]);

  const handleProcess = async (orderId, action, amount) => {
    const reason =
      action === "reject"
        ? (window.prompt("Rejection reason (optional):") ?? "")
        : "admin_approved";
    if (reason === null) return;

    setProcessingId(orderId);
    try {
      const { data } = await adminAPI.processRefund(
        orderId,
        action,
        amount,
        reason,
      );
      addToast(data.message, action === "approve" ? "success" : "info");
      loadRefunds();
    } catch (e) {
      addToast(
        e.response?.data?.message || "Failed to process refund",
        "error",
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Customer refund requests
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Approving calls Razorpay API and initiates the refund
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["pending", "refunded", "failed", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                background: filter === s ? "var(--brand)" : "var(--elevated)",
                color: filter === s ? "white" : "var(--text-muted)",
              }}
            >
              {s}
            </button>
          ))}
          <button
            onClick={loadRefunds}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{
              background: "var(--elevated)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl h-24 shimmer"
              style={{ backgroundColor: "var(--card)" }}
            />
          ))}
        </div>
      ) : refunds.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="text-5xl mb-3">💳</div>
          <p
            className="font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            No {filter === "all" ? "" : filter} refunds
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {refunds.map((order) => {
            const rs = order.refundStatus || "pending";
            const cfg =
              REFUND_STATUS_COLORS[rs] || REFUND_STATUS_COLORS.pending;
            const isProc = processingId === order._id;
            const isPending = ["pending", "manual_pending"].includes(rs);
            const isExpanded = expandedId === order._id;

            return (
              <div
                key={order._id}
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order._id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,107,53,0.1)" }}
                  >
                    <CreditCard size={16} style={{ color: "var(--brand)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className="font-bold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {order.userId?.name || "Customer"}
                      </p>
                      <span
                        className="tag text-[10px]"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      {order.paymentMethod === "cod" && (
                        <span
                          className="tag text-[10px]"
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: "#f59e0b",
                          }}
                        >
                          COD (manual)
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {order.storeId?.name} · #
                      {order._id?.slice(-8).toUpperCase()} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-black text-lg"
                      style={{ color: "var(--brand)" }}
                    >
                      ₹{order.totalPrice}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Refund: ₹{order.refundAmount ?? order.totalPrice}
                    </p>
                  </div>

                  {isExpanded ? (
                    <ChevronUp
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      style={{ color: "var(--text-muted)" }}
                    />
                  )}
                </div>

                {isExpanded && (
                  <div
                    className="px-5 pb-4 space-y-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div className="grid grid-cols-2 gap-3 pt-3 text-xs">
                      {[
                        { label: "Customer Email", value: order.userId?.email },
                        { label: "Phone", value: order.userId?.phone || "—" },
                        {
                          label: "Payment ID",
                          value: order.paymentId || "COD / Not available",
                        },
                        {
                          label: "Refund ID",
                          value: order.refundId || "Not yet initiated",
                        },
                        {
                          label: "Refund Reason",
                          value: order.refundReason?.replace(/_/g, " ") || "—",
                        },
                        {
                          label: "Items",
                          value: order.items?.map((i) => i.name).join(", "),
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p
                            className="font-bold uppercase tracking-wider"
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "9px",
                            }}
                          >
                            {label}
                          </p>
                          <p
                            className="mt-0.5 font-medium truncate"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {isPending && (
                      <div
                        className="flex gap-2 pt-2"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <button
                          onClick={() =>
                            handleProcess(
                              order._id,
                              "approve",
                              order.totalPrice,
                            )
                          }
                          disabled={isProc}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-60"
                          style={{
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.3)",
                          }}
                        >
                          {isProc ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Approve & Refund ₹{order.totalPrice}
                        </button>
                        <button
                          onClick={() => handleProcess(order._id, "reject")}
                          disabled={isProc}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-60"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          {isProc ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <X size={12} />
                          )}
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
