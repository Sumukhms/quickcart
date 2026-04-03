/**
 * PaymentFailurePage.jsx
 *
 * Shown when:
 *   a) Razorpay payment fails / is dismissed
 *   b) Payment verification fails post-charge
 *   c) Stock runs out mid-payment
 *
 * Supports:
 *   - Retry payment (navigates back to checkout)
 *   - Refund request (if payment was captured but order failed)
 *   - Manual refund status polling
 *   - Support contact links
 *
 * Route: /payment/failure  (add to App.jsx routes)
 *
 * Can also be rendered inline — pass props directly:
 *   <PaymentFailurePage
 *     orderId={order._id}
 *     paymentId="pay_xxx"
 *     errorType="stock"
 *     message="Item out of stock"
 *   />
 */
import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import {
  XCircle, RefreshCw, AlertTriangle, Loader2, Check,
  ChevronRight, Headphones, ShoppingBag, ArrowLeft,
  CreditCard, Clock, ShieldAlert,
} from "lucide-react";
import api from "../../api/api.js";

// ── Error type configuration ──────────────────────────────────
const ERROR_CONFIG = {
  cancelled: {
    emoji:   "😕",
    title:   "Payment Cancelled",
    message: "You cancelled the payment. No charges were made.",
    color:   "#f59e0b",
    bg:      "rgba(245,158,11,0.08)",
    border:  "rgba(245,158,11,0.25)",
    icon:    XCircle,
    canRetry: true,
    isCharged: false,
  },
  failed: {
    emoji:   "❌",
    title:   "Payment Failed",
    message: "The payment could not be processed. Please try again or use a different method.",
    color:   "#ef4444",
    bg:      "rgba(239,68,68,0.08)",
    border:  "rgba(239,68,68,0.3)",
    icon:    XCircle,
    canRetry: true,
    isCharged: false,
  },
  stock: {
    emoji:   "📦",
    title:   "Item Out of Stock",
    message: "One or more items in your cart ran out of stock. Your payment will be refunded within 3–5 business days.",
    color:   "#ef4444",
    bg:      "rgba(239,68,68,0.06)",
    border:  "rgba(239,68,68,0.2)",
    icon:    ShieldAlert,
    canRetry: false,
    isCharged: true,   // payment was taken, needs refund
  },
  verification: {
    emoji:   "🔒",
    title:   "Verification Failed",
    message: "We couldn't verify your payment. If money was deducted, contact our support team immediately.",
    color:   "#ef4444",
    bg:      "rgba(239,68,68,0.08)",
    border:  "rgba(239,68,68,0.3)",
    icon:    ShieldAlert,
    canRetry: false,
    isCharged: null,   // unknown
  },
  timeout: {
    emoji:   "⏱️",
    title:   "Session Timed Out",
    message: "Your payment session expired. Please try again.",
    color:   "#f59e0b",
    bg:      "rgba(245,158,11,0.08)",
    border:  "rgba(245,158,11,0.25)",
    icon:    Clock,
    canRetry: true,
    isCharged: false,
  },
};

function RefundStatusBadge({ status }) {
  const map = {
    pending:        { label: "Refund Processing",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    refunded:       { label: "Refunded ✓",          color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
    manual_pending: { label: "Manual Review",       color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
    failed:         { label: "Refund Failed",        color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    none:           { label: "No Refund Initiated",  color: "var(--text-muted)", bg: "var(--elevated)" },
  };
  const cfg = map[status] || map.none;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────
export default function PaymentFailurePage({
  // Props when rendered inline (from checkout)
  orderId:    propOrderId,
  paymentId:  propPaymentId,
  errorType:  propErrorType,
  message:    propMessage,
  available:  propAvailable,
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read from either props or URL search params
  const orderId   = propOrderId   || searchParams.get("orderId");
  const paymentId = propPaymentId || searchParams.get("paymentId");
  const errorType = propErrorType || searchParams.get("type") || "failed";
  const customMsg = propMessage   || searchParams.get("message");

  const config = ERROR_CONFIG[errorType] || ERROR_CONFIG.failed;
  const Icon   = config.icon;

  const [refunding,     setRefunding]     = useState(false);
  const [refundStatus,  setRefundStatus]  = useState(null);  // null | object
  const [refundError,   setRefundError]   = useState("");
  const [polling,       setPolling]       = useState(false);

  // Auto-fetch refund status if an orderId is available
  useEffect(() => {
    if (!orderId) return;
    fetchRefundStatus(true);
  }, [orderId]); // eslint-disable-line

  const fetchRefundStatus = async (silent = false) => {
    if (!orderId) return;
    if (!silent) setPolling(true);
    try {
      const { data } = await api.get(`/payment/refund/${orderId}`);
      setRefundStatus(data);
    } catch {
      // Non-critical
    } finally {
      setPolling(false);
    }
  };

  const handleRequestRefund = async () => {
    if (!orderId) return;
    setRefunding(true);
    setRefundError("");
    try {
      const { data } = await api.post("/payment/refund", {
        orderId,
        reason: "payment_failed_stock_issue",
      });
      setRefundStatus({ refundStatus: "pending", ...data });
    } catch (err) {
      setRefundError(err.response?.data?.message || "Failed to initiate refund. Please contact support.");
    } finally {
      setRefunding(false);
    }
  };

  const handleRetry = () => {
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 page-enter"
      style={{ backgroundColor: "var(--bg)" }}>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 w-96 h-96 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, ${config.color}, transparent)`,
            transform: "translate(-50%, -50%)",
          }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Back button */}
        <Link to="/user/home"
          className="inline-flex items-center gap-2 text-sm font-semibold mb-6 transition-all hover:translate-x-(-0.5)"
          style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={15} /> Back to Home
        </Link>

        {/* Main error card */}
        <div className="rounded-3xl overflow-hidden shadow-2xl mb-4"
          style={{ backgroundColor: "var(--card)", border: `1.5px solid ${config.border}` }}>

          {/* Top accent */}
          <div className="h-1.5 w-full" style={{ background: config.color }} />

          <div className="p-6">
            {/* Icon + title */}
            <div className="text-center mb-6">
              <div className="relative inline-flex mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: config.bg }}>
                  <span style={{ fontSize: "2.5rem" }}>{config.emoji}</span>
                </div>
                {/* Pulsing ring for charged states */}
                {config.isCharged && (
                  <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                    style={{ background: config.color }} />
                )}
              </div>

              <h1 className="font-display font-bold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
                {config.title}
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {customMsg || config.message}
              </p>

              {/* Available stock hint */}
              {propAvailable !== undefined && propAvailable > 0 && (
                <p className="text-xs mt-2 font-semibold" style={{ color: "#f59e0b" }}>
                  Only {propAvailable} unit{propAvailable > 1 ? "s" : ""} remain in stock
                </p>
              )}
            </div>

            {/* Payment / Order details */}
            {(orderId || paymentId) && (
              <div className="rounded-2xl p-4 mb-5"
                style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
                {orderId && (
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: "var(--text-muted)" }}>Order ID</span>
                    <span className="font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                      #{orderId.slice(-8).toUpperCase()}
                    </span>
                  </div>
                )}
                {paymentId && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--text-muted)" }}>Payment ID</span>
                    <span className="font-mono font-semibold text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      {paymentId}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Refund status */}
            {refundStatus && (
              <div className="rounded-2xl p-4 mb-5 space-y-2"
                style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Refund Status</p>
                  <button onClick={() => fetchRefundStatus()} disabled={polling}
                    className="p-1 rounded-lg transition-all hover:scale-110"
                    style={{ color: "var(--text-muted)" }}>
                    <RefreshCw size={12} className={polling ? "animate-spin" : ""} />
                  </button>
                </div>
                <RefundStatusBadge status={refundStatus.refundStatus} />
                {refundStatus.refundStatus === "pending" && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    ⏱ Your refund is being processed and will arrive in 3–5 business days to your original payment method.
                  </p>
                )}
                {refundStatus.refundStatus === "refunded" && (
                  <p className="text-xs font-semibold" style={{ color: "#22c55e" }}>
                    ₹{refundStatus.amount?.toFixed(2)} has been refunded successfully!
                  </p>
                )}
              </div>
            )}

            {/* Refund error */}
            {refundError && (
              <div className="rounded-xl p-3 mb-4 flex items-start gap-2 text-xs"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                {refundError}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {/* Retry payment */}
              {config.canRetry && (
                <button onClick={handleRetry}
                  className="btn btn-brand w-full justify-center py-3.5 text-base"
                  style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.3)" }}>
                  <CreditCard size={16} /> Try Again
                </button>
              )}

              {/* Request refund (for charged states) */}
              {config.isCharged && orderId && !refundStatus?.refundStatus?.match(/pending|refunded/) && (
                <button
                  onClick={handleRequestRefund}
                  disabled={refunding}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    color:      "#3b82f6",
                    border:     "1.5px solid rgba(59,130,246,0.25)",
                  }}
                >
                  {refunding
                    ? <><Loader2 size={16} className="animate-spin" /> Processing refund...</>
                    : <><Check size={16} /> Request Refund</>
                  }
                </button>
              )}

              {/* Browse stores (alternative) */}
              <Link to="/user/home"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01]"
                style={{ background: "var(--elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                <ShoppingBag size={15} /> Browse Stores
              </Link>
            </div>
          </div>
        </div>

        {/* Support card */}
        <div className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(59,130,246,0.1)" }}>
            <Headphones size={16} style={{ color: "#3b82f6" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Need help?</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Our support team is available 9am–9pm</p>
          </div>
          <a href="mailto:support@quickcart.in"
            className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
            style={{ color: "#3b82f6" }}>
            Contact <ChevronRight size={13} />
          </a>
        </div>

      </div>
    </div>
  );
}