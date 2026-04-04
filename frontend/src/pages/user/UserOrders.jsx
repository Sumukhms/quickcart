/**
 * UserOrders.jsx — UPDATED
 *
 * New features vs original:
 *   1. Search bar — filter by order ID (last 8 chars) or store name
 *   2. Refunds tab — shows only orders that have a refundStatus set
 *      Displays: order ID, store, amount, refund status, date initiated
 *
 * All existing functionality (cancel, reorder, tabs, pagination) preserved.
 */
import { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, Clock, CheckCircle, Truck, XCircle, ChevronRight,
  RefreshCw, Zap, Loader2, RotateCcw, Ban, ArrowLeft,
  Search, X, CreditCard, AlertCircle,
} from "lucide-react";
import { orderAPI } from "../../api/api";
import { useCart }  from "../../context/CartContext";
import { useAuth }  from "../../context/AuthContext";
import { EmptyState } from "../../components/ui/Skeleton";
import { useOrders }  from "../../hooks/useOrders";

const STATUS_CONFIG = {
  pending:          { label: "Pending",          color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: Clock,        emoji: "⏳" },
  confirmed:        { label: "Confirmed",         color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: CheckCircle,  emoji: "✅" },
  preparing:        { label: "Preparing",         color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: Package,      emoji: "👨‍🍳" },
  packing:          { label: "Packing",           color: "#06b6d4", bg: "rgba(6,182,212,0.12)",   icon: Package,      emoji: "📦" },
  ready_for_pickup: { label: "Ready for Pickup",  color: "#f97316", bg: "rgba(249,115,22,0.12)",  icon: Zap,          emoji: "📦" },
  out_for_delivery: { label: "Out for Delivery",  color: "#ff6b35", bg: "rgba(255,107,53,0.12)",  icon: Truck,        emoji: "🛵" },
  delivered:        { label: "Delivered",         color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCircle,  emoji: "🎉" },
  cancelled:        { label: "Cancelled",         color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle,      emoji: "❌" },
};

const REFUND_STATUS_CONFIG = {
  pending:        { label: "Processing",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  refunded:       { label: "Refunded ✓",     color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  manual_pending: { label: "Manual Review",  color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  failed:         { label: "Failed",         color: "#ef4444", bg: "rgba(239,68,68,0.12)"  },
  none:           { label: "No Refund",      color: "#5a5a6e", bg: "rgba(90,90,110,0.1)"   },
};

const CANCELLABLE     = ["pending", "confirmed"];
const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "packing", "ready_for_pickup", "out_for_delivery"];

const BACK_ROUTE = {
  customer: "/user/home",
  store:    "/store/dashboard",
  delivery: "/delivery/dashboard",
};

// ─── Refund Row ───────────────────────────────────────────────
function RefundRow({ order }) {
  const rs   = order.refundStatus || "none";
  const cfg  = REFUND_STATUS_CONFIG[rs] || REFUND_STATUS_CONFIG.none;
  const sc   = STATUS_CONFIG[order.status] || STATUS_CONFIG.cancelled;
  const date = order.refundInitiatedAt
    ? new Date(order.refundInitiatedAt)
    : new Date(order.createdAt);

  return (
    <div
      className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: "var(--elevated)" }}
          >
            <CreditCard size={16} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {order.storeId?.name || "Store"}
            </p>
            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
              #{(order._id || "").slice(-8).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span
            className="tag text-[10px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          <span
            className="tag text-[10px]"
            style={{ background: sc.bg, color: sc.color }}
          >
            {sc.emoji} {sc.label}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-3 pt-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
            Order Total
          </p>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            ₹{order.totalPrice?.toFixed(0) || "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
            Refund Amount
          </p>
          <p className="text-sm font-bold" style={{ color: rs === "refunded" ? "#22c55e" : "var(--text-secondary)" }}>
            {order.refundAmount != null ? `₹${order.refundAmount.toFixed(0)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
            Date
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
          </p>
        </div>
      </div>

      {order.refundReason && (
        <p className="text-xs mt-2 px-2 py-1.5 rounded-lg" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
          Reason: {order.refundReason.replace(/_/g, " ")}
        </p>
      )}

      <div className="flex justify-end mt-3">
        <Link
          to={`/user/orders/${order._id}`}
          className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: "var(--brand)" }}
        >
          View order <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// ─── Search Bar (local, no debounce needed — client-side only) ─
function OrderSearchBar({ value, onChange }) {
  return (
    <div className="relative mb-4">
      <Search
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        type="text"
        className="input-theme pl-10 pr-10 text-sm py-2.5"
        placeholder="Search by order ID or store name…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-all hover:scale-110"
          style={{ color: "var(--text-muted)" }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function UserOrders() {
  const navigate = useNavigate();
  const { cartStore, clearCart, addToCart, addToast } = useCart();
  const { user } = useAuth();

  const {
    data: orders, loading, error, filter, setFilter,
    refresh: fetchOrders, patchOrder, counts, filtered,
  } = useOrders(() => orderAPI.getMy().then(r => r.data));

  const [cancelling,  setCancelling]  = useState(null);
  const [reordering,  setReordering]  = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Search filtering (applied on top of status filter) ────
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase().trim();
    return filtered.filter((order) => {
      const matchId    = (order._id || "").toLowerCase().includes(q) ||
                         (order._id || "").slice(-8).toLowerCase().includes(q);
      const matchStore = (order.storeId?.name || "").toLowerCase().includes(q);
      return matchId || matchStore;
    });
  }, [filtered, searchQuery]);

  // ── Refund orders (separate from status filter) ────────────
  const refundOrders = useMemo(() => {
    const hasRefund = orders.filter(
      (o) => o.refundStatus && o.refundStatus !== "none" && o.refundStatus !== undefined
    );
    if (!searchQuery.trim()) return hasRefund;
    const q = searchQuery.toLowerCase().trim();
    return hasRefund.filter(
      (o) =>
        (o._id || "").toLowerCase().includes(q) ||
        (o.storeId?.name || "").toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const isRefundTab = filter === "refunds";

  // ── Cancel order ──────────────────────────────────────────
  const handleCancel = useCallback(async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(orderId);
    try {
      await orderAPI.cancel(orderId);
      patchOrder(orderId, { status: "cancelled" });
      addToast("Order cancelled successfully", "info");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to cancel order", "error");
    } finally { setCancelling(null); }
  }, [addToast, patchOrder]);

  // ── Reorder ───────────────────────────────────────────────
  const handleReorder = useCallback(async (order) => {
    const store = order.storeId;
    if (!store || !order.items?.length) {
      addToast("Cannot reorder — store info missing", "error");
      return;
    }
    if (cartStore && cartStore._id !== (store._id || store)) {
      if (!window.confirm(`Clear cart and reorder from "${store.name}"?`)) return;
      clearCart();
    }
    setReordering(order._id);
    let added = 0;
    for (const item of order.items) {
      const product = {
        _id:       item.productId,
        name:      item.name,
        price:     item.price,
        image:     item.image || "",
        available: true,
        unit:      item.unit || "",
      };
      const ok = addToCart(product, store);
      if (ok !== false) added++;
    }
    setReordering(null);
    if (added > 0) {
      addToast(`${added} item${added > 1 ? "s" : ""} added to cart`, "success");
      navigate("/user/cart");
    } else {
      addToast("Could not add items — they may be unavailable", "warning");
    }
  }, [cartStore, clearCart, addToCart, addToast, navigate]);

  const activeCount = counts.active;

  const TABS = [
    { id: "all",       label: "All",       count: counts.all },
    { id: "active",    label: "Active",    count: counts.active },
    { id: "delivered", label: "Delivered", count: counts.delivered },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
    { id: "refunds",   label: "Refunds",   count: orders.filter((o) => o.refundStatus && o.refundStatus !== "none").length },
  ];

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to={BACK_ROUTE[user?.role] || "/user/home"}
              className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              title="Go back"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
                My Orders
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                {orders.length} order{orders.length !== 1 ? "s" : ""}
                {activeCount > 0 && ` · ${activeCount} active`}
                {user?.role !== "customer" && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                    Personal orders
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl transition-all hover:rotate-180 duration-500"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Active pulse banner */}
        {activeCount > 0 && (
          <div
            className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "rgba(255,107,53,0.08)", border: "1.5px solid rgba(255,107,53,0.2)" }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: "var(--brand)", animation: "pulseDot 1.5s infinite" }}
            />
            <p className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
              {activeCount} order{activeCount > 1 ? "s" : ""} in progress
            </p>
            <button onClick={() => setSearchQuery("") || setFilter("active")} className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              View →
            </button>
          </div>
        )}

        {/* Search bar */}
        <OrderSearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Search hint */}
        {searchQuery && (
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {isRefundTab
              ? `${refundOrders.length} refund${refundOrders.length !== 1 ? "s" : ""} matching "${searchQuery}"`
              : `${searchFiltered.length} result${searchFiltered.length !== 1 ? "s" : ""} matching "${searchQuery}"`}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => { setFilter(id); setSearchQuery(""); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === id ? "var(--brand)" : "var(--elevated)",
                color:      filter === id ? "white"         : "var(--text-muted)",
                border: `1px solid ${filter === id ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    background: filter === id ? "rgba(255,255,255,0.2)" : "var(--border)",
                    color:      filter === id ? "white"                  : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertCircle size={16} style={{ color: "#ef4444" }} />
            <p className="text-sm flex-1" style={{ color: "#ef4444" }}>{error}</p>
            <button onClick={fetchOrders} className="text-xs font-semibold" style={{ color: "var(--brand)" }}>Retry</button>
          </div>
        )}

        {/* ── REFUNDS TAB ──────────────────────────────────── */}
        {isRefundTab ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
            </div>
          ) : refundOrders.length === 0 ? (
            <EmptyState
              icon="💳"
              title="No refunds found"
              subtitle={
                searchQuery
                  ? `No refunds matching "${searchQuery}"`
                  : "Cancelled or refunded orders with payment issues will appear here"
              }
              action={
                searchQuery ? (
                  <button onClick={() => setSearchQuery("")} className="btn btn-ghost text-sm">
                    Clear search
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="space-y-3 stagger">
              {/* Refund summary */}
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="text-2xl">💳</div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                    {refundOrders.length} refund{refundOrders.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Total requested: ₹{refundOrders.reduce((s, o) => s + (o.refundAmount || o.totalPrice || 0), 0).toFixed(0)}
                    &nbsp;·&nbsp;
                    {refundOrders.filter((o) => o.refundStatus === "refunded").length} completed
                  </p>
                </div>
              </div>

              {refundOrders.map((order) => (
                <RefundRow key={order._id} order={order} />
              ))}
            </div>
          )

        ) : (
          /* ── ORDERS LIST (all other tabs) ──────────────── */
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading orders...</p>
            </div>
          ) : searchFiltered.length === 0 ? (
            <EmptyState
              icon="📦"
              title={searchQuery ? "No results found" : "No orders found"}
              subtitle={
                searchQuery
                  ? `No orders matching "${searchQuery}". Try the order ID (last 8 chars) or the store name.`
                  : filter !== "all"
                  ? "Nothing in this category"
                  : "Your past and current orders will appear here"
              }
              action={
                searchQuery ? (
                  <button onClick={() => setSearchQuery("")} className="btn btn-ghost text-sm">
                    Clear search
                  </button>
                ) : (
                  <Link to="/user/home" className="btn btn-brand text-sm">Browse Stores</Link>
                )
              }
            />
          ) : (
            <div className="space-y-3 stagger">
              {searchFiltered.map((order) => {
                const sc         = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const Icon       = sc.icon;
                const date       = new Date(order.createdAt);
                const isActive   = ACTIVE_STATUSES.includes(order.status);
                const canCancel  = CANCELLABLE.includes(order.status);
                const itemCount  = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;
                const hasRefund  = order.refundStatus && order.refundStatus !== "none";

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "var(--card)",
                      border: `1px solid ${isActive ? "rgba(255,107,53,0.2)" : "var(--border)"}`,
                    }}
                  >
                    <div className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                            style={{ background: "var(--elevated)" }}
                          >
                            {sc.emoji}
                          </div>
                          <div>
                            <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                              {order.storeId?.name || "Store"}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                              {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
                              {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}
                              <span className="font-mono">#{(order._id || "").slice(-8).toUpperCase()}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span
                            className="flex items-center gap-1.5 tag text-xs"
                            style={{ background: sc.bg, color: sc.color }}
                          >
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.color }} />
                            )}
                            <Icon size={11} /> {sc.label}
                          </span>
                          {hasRefund && (
                            <span
                              className="tag text-[10px]"
                              style={{
                                background: REFUND_STATUS_CONFIG[order.refundStatus]?.bg || "var(--elevated)",
                                color:      REFUND_STATUS_CONFIG[order.refundStatus]?.color || "var(--text-muted)",
                              }}
                            >
                              💳 {REFUND_STATUS_CONFIG[order.refundStatus]?.label || "Refund"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items preview */}
                      <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                        {order.items?.slice(0, 3).map(i => i.name).join(", ")}
                        {order.items?.length > 3 && ` +${order.items.length - 3} more`}
                      </p>

                      {/* Footer row */}
                      <div
                        className="flex items-center justify-between pt-3 border-t"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                            ₹{(order.totalPrice + (order.deliveryFee || 0)).toFixed(0)}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {itemCount} item{itemCount !== 1 ? "s" : ""}
                          </span>
                          {order.paymentMethod && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-md"
                              style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
                            >
                              {order.paymentMethod === "cod" ? "💵 COD" : "💳 Online"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Reorder (delivered only) */}
                          {order.status === "delivered" && (
                            <button
                              onClick={() => handleReorder(order)}
                              disabled={reordering === order._id}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
                            >
                              {reordering === order._id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <><RotateCcw size={12} /> Reorder</>}
                            </button>
                          )}
                          {/* Cancel */}
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(order._id)}
                              disabled={cancelling === order._id}
                              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                            >
                              {cancelling === order._id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <><Ban size={12} /> Cancel</>}
                            </button>
                          )}
                          {/* Track / Details */}
                          <Link
                            to={`/user/orders/${order._id}`}
                            className="flex items-center gap-1 text-sm font-semibold"
                            style={{ color: "var(--brand)" }}
                          >
                            {isActive ? "Track" : "Details"} <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}