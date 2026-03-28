import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, Clock, CheckCircle, Truck, XCircle, ChevronRight,
  RefreshCw, Zap, Loader2, RotateCcw, Ban,
} from "lucide-react";
import { orderAPI } from "../../api/api";
import { useCart } from "../../context/CartContext";
import { EmptyState } from "../../components/ui/Skeleton";

const STATUS_CONFIG = {
  pending:          { label: "Pending",         color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: Clock,       emoji: "⏳" },
  confirmed:        { label: "Confirmed",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: CheckCircle, emoji: "✅" },
  preparing:        { label: "Preparing",        color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  icon: Package,     emoji: "👨‍🍳" },
  packing:          { label: "Packing",          color: "#06b6d4", bg: "rgba(6,182,212,0.12)",   icon: Package,     emoji: "📦" },
  ready_for_pickup: { label: "Ready for Pickup", color: "#f97316", bg: "rgba(249,115,22,0.12)",  icon: Zap,         emoji: "📦" },
  out_for_delivery: { label: "Out for Delivery", color: "#ff6b35", bg: "rgba(255,107,53,0.12)",  icon: Truck,       emoji: "🛵" },
  delivered:        { label: "Delivered",        color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCircle, emoji: "🎉" },
  cancelled:        { label: "Cancelled",        color: "#ef4444", bg: "rgba(239,68,68,0.12)",   icon: XCircle,     emoji: "❌" },
};

// Orders that the customer can still cancel
const CANCELLABLE = ["pending", "confirmed"];
const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "packing", "ready_for_pickup", "out_for_delivery"];

export default function UserOrders() {
  const navigate = useNavigate();
  const { cartStore, clearCart, addToCart, addToast } = useCart();

  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filter,      setFilter]      = useState("all");
  const [cancelling,  setCancelling]  = useState(null);   // orderId being cancelled
  const [reordering,  setReordering]  = useState(null);   // orderId being reordered

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await orderAPI.getMy();
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Feature 1: Cancel ──────────────────────────────────────
  const handleCancel = useCallback(async (orderId) => {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(orderId);
    try {
      await orderAPI.cancel(orderId);
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status: "cancelled" } : o)
      );
      addToast("Order cancelled successfully", "info");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to cancel order", "error");
    } finally {
      setCancelling(null);
    }
  }, [addToast]);

  // ── Feature 2: Reorder ─────────────────────────────────────
  const handleReorder = useCallback(async (order) => {
    const store = order.storeId;
    if (!store || !order.items?.length) {
      addToast("Cannot reorder — store info missing", "error");
      return;
    }

    // Warn if cart has items from a different store
    if (cartStore && cartStore._id !== (store._id || store)) {
      if (!window.confirm(`Your cart has items from "${cartStore.name}". Clear and reorder from "${store.name}"?`)) return;
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

  // ── Filtering ──────────────────────────────────────────────
  const filtered = orders.filter(o => {
    if (filter === "active")    return ACTIVE_STATUSES.includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const activeCount = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const TABS = [
    { id: "all",       label: "All",       count: orders.length },
    { id: "active",    label: "Active",    count: activeCount },
    { id: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
    { id: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
  ];

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>My Orders</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {orders.length} order{orders.length !== 1 ? "s" : ""}
              {activeCount > 0 && ` · ${activeCount} active`}
            </p>
          </div>
          <button onClick={fetchOrders}
            className="p-2.5 rounded-xl transition-all hover:rotate-180 duration-500"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Active pulse banner */}
        {activeCount > 0 && (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "rgba(255,107,53,0.08)", border: "1.5px solid rgba(255,107,53,0.2)" }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: "var(--brand)", animation: "pulseDot 1.5s infinite" }} />
            <p className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
              {activeCount} order{activeCount > 1 ? "s" : ""} in progress
            </p>
            <button onClick={() => setFilter("active")} className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              View →
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, count }) => (
            <button key={id} onClick={() => setFilter(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === id ? "var(--brand)" : "var(--elevated)",
                color:      filter === id ? "white"         : "var(--text-muted)",
                border: `1px solid ${filter === id ? "var(--brand)" : "var(--border)"}`,
              }}>
              {label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: filter === id ? "rgba(255,255,255,0.2)" : "var(--border)", color: filter === id ? "white" : "var(--text-muted)" }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
            <button onClick={fetchOrders} className="ml-auto text-xs font-semibold" style={{ color: "var(--brand)" }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📦" title="No orders found"
            subtitle={filter !== "all" ? "Nothing in this category" : "Your past and current orders will appear here"}
            action={<Link to="/user/home" className="btn btn-brand text-sm">Browse Stores</Link>} />
        ) : (
          <div className="space-y-3 stagger">
            {filtered.map(order => {
              const sc        = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon      = sc.icon;
              const date      = new Date(order.createdAt);
              const isActive  = ACTIVE_STATUSES.includes(order.status);
              const canCancel = CANCELLABLE.includes(order.status);
              const itemCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;

              return (
                <div key={order._id}
                  className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--card)",
                    border: `1px solid ${isActive ? "rgba(255,107,53,0.2)" : "var(--border)"}`,
                  }}>
                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: "var(--elevated)" }}>{sc.emoji}</div>
                        <div>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                            {order.storeId?.name || "Store"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 tag text-xs" style={{ background: sc.bg, color: sc.color }}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.color }} />}
                        <Icon size={11} /> {sc.label}
                      </span>
                    </div>

                    {/* Items preview */}
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                      {order.items?.slice(0, 3).map(i => i.name).join(", ")}
                      {order.items?.length > 3 && ` +${order.items.length - 3} more`}
                    </p>

                    {/* Footer row */}
                    <div className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: "var(--border)" }}>

                      {/* Price + meta */}
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                          ₹{(order.totalPrice + (order.deliveryFee || 0)).toFixed(0)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {itemCount} item{itemCount !== 1 ? "s" : ""}
                        </span>
                        {order.paymentMethod && (
                          <span className="text-xs px-2 py-0.5 rounded-md"
                            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                            {order.paymentMethod === "cod" ? "💵 COD" : "💳 Online"}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">

                        {/* ── Feature 2: Reorder (delivered only) ── */}
                        {order.status === "delivered" && (
                          <button
                            onClick={() => handleReorder(order)}
                            disabled={reordering === order._id}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                            style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}>
                            {reordering === order._id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <><RotateCcw size={12} /> Reorder</>}
                          </button>
                        )}

                        {/* ── Feature 1: Cancel (pending/confirmed only) ── */}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(order._id)}
                            disabled={cancelling === order._id}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                            {cancelling === order._id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <><Ban size={12} /> Cancel</>}
                          </button>
                        )}

                        {/* Track / Details link */}
                        <Link to={`/user/orders/${order._id}`}
                          className="flex items-center gap-1 text-sm font-semibold"
                          style={{ color: "var(--brand)" }}>
                          {isActive ? "Track" : "Details"} <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}