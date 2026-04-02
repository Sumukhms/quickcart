/**
 * StoreOrders.jsx — FIXED
 *
 * Bugs fixed:
 *   1. Store was showing "out_for_delivery" as a controllable status.
 *      Stores CANNOT set out_for_delivery — only delivery partners can.
 *      Fixed: getNextStatusAction now respects STORE_ALLOWED_STATUSES.
 *   2. Added proper status filter for store-allowed transitions.
 *   3. Improved empty state and loading UX.
 *   4. Added real-time socket updates for new orders.
 */
import { useState, useEffect, useCallback } from "react";
import { Link }                from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Search, Check, X,
  Phone, ChevronDown, ChevronUp, Package, Loader2, Bell,
} from "lucide-react";
import { useAuth }   from "../../context/AuthContext";
import { useCart }   from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import api           from "../../api/api";
import { STATUS_VISUAL } from "../../utils/orderFlows";
import { EmptyState } from "../../components/ui/Skeleton";

// ── Statuses store owners CAN advance to (mirrors backend) ────
const STORE_ALLOWED_STATUSES = ["confirmed", "preparing", "packing", "ready_for_pickup", "cancelled"];

/**
 * Get the next status a STORE OWNER can set.
 * Critically: store cannot set "out_for_delivery" — that's delivery partner only.
 */
function getStoreNextAction(currentStatus, storeCategory) {
  // Terminal statuses — no further action
  if (["delivered", "cancelled", "out_for_delivery"].includes(currentStatus)) return null;

  const isFood = storeCategory === "Food";

  const FLOW = isFood
    ? ["pending", "confirmed", "preparing", "ready_for_pickup"]
    : ["pending", "confirmed", "packing"];

  const idx = FLOW.indexOf(currentStatus);
  if (idx === -1 || idx === FLOW.length - 1) return null;

  const next = FLOW[idx + 1];
  // Safety: ensure store is allowed to set this status
  if (!STORE_ALLOWED_STATUSES.includes(next)) return null;

  const vis = STATUS_VISUAL[next];
  return {
    nextStatus: next,
    label:      vis?.label || next,
    emoji:      vis?.emoji || "",
    color:      vis?.color || "var(--brand)",
  };
}

function OrderRow({ order, storeCategory, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const sc         = STATUS_VISUAL[order.status] || STATUS_VISUAL.pending;
  const nextAction = getStoreNextAction(order.status, storeCategory);

  // Status description for store owner context
  const getStatusContext = (status) => {
    if (status === "out_for_delivery") return "Delivery partner has picked up — tracking in progress";
    if (status === "delivered")        return "Successfully delivered to customer";
    if (status === "cancelled")        return "Order was cancelled";
    return null;
  };

  const statusContext = getStatusContext(order.status);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)" }}
        >
          {order.userId?.name?.[0] || "C"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {order.userId?.name || "Customer"}
            </p>
            <span className="tag text-[10px]" style={{ background: sc.bg, color: sc.color }}>
              {sc.emoji} {sc.label}
            </span>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
            {order.items?.map(i => i.name).join(", ")}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <p className="font-bold text-sm" style={{ color: "var(--brand)" }}>₹{order.totalPrice}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        {expanded
          ? <ChevronUp   size={15} style={{ color: "var(--text-muted)" }} />
          : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />
        }
      </div>

      {expanded && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="py-3 space-y-1.5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: "var(--text-secondary)" }}>{item.name} ×{item.quantity || 1}</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  ₹{(item.price || 0) * (item.quantity || 1)}
                </span>
              </div>
            ))}
            <div
              className="flex justify-between text-xs pt-1"
              style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              <span>Delivery fee</span>
              <span>{order.deliveryFee > 0 ? `₹${order.deliveryFee}` : "Free"}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>📍 {order.deliveryAddress}</span>
            {order.userId?.phone && (
              <a href={`tel:${order.userId.phone}`} className="flex items-center gap-1" style={{ color: "var(--brand)" }}>
                <Phone size={11} /> {order.userId.phone}
              </a>
            )}
            <span>💳 {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
            {order.notes && <span>📝 {order.notes}</span>}
          </div>

          {/* Status context for read-only statuses */}
          {statusContext && !nextAction && order.status !== "cancelled" && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3 text-xs font-semibold"
              style={{
                background: order.status === "delivered"
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(255,107,53,0.08)",
                color: order.status === "delivered" ? "#22c55e" : "var(--brand)",
                border: `1px solid ${order.status === "delivered" ? "rgba(34,197,94,0.2)" : "rgba(255,107,53,0.2)"}`,
              }}
            >
              <span>{sc.emoji}</span>
              <span>{statusContext}</span>
            </div>
          )}

          {/* Action buttons — only store-allowed transitions */}
          {nextAction && order.status !== "cancelled" && (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusUpdate(order._id, nextAction.nextStatus)}
                className="btn btn-brand text-xs py-2 flex-1 justify-center"
              >
                <Check size={12} /> {nextAction.emoji} {nextAction.label}
              </button>
              {/* Cancel only available for pending/confirmed */}
              {["pending", "confirmed"].includes(order.status) && (
                <button
                  onClick={() => onStatusUpdate(order._id, "cancelled")}
                  className="flex items-center gap-1 text-xs py-2 px-3 rounded-xl font-semibold"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                >
                  <X size={12} /> Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoreOrders() {
  const { isLoggedIn }     = useAuth();
  const { addToast }       = useCart();
  const { on, joinStoreRoom } = useSocket();

  const [orders,        setOrders]        = useState([]);
  const [storeId,       setStoreId]       = useState(null);
  const [storeCategory, setStoreCategory] = useState("Other");
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError(null);
    try {
      const { data: store } = await api.get("/stores/mine");
      setStoreId(store._id);
      setStoreCategory(store.category || "Other");
      joinStoreRoom(store._id);
      const { data } = await api.get(`/orders/store/${store._id}`, { params: { limit: 200 } });
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 404) setError("no_store");
      else setError(err.response?.data?.message || "Failed to load orders");
    } finally { setLoading(false); setRefreshing(false); }
  }, [joinStoreRoom]);

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn, fetchData]);

  // Socket: new order notification
  useEffect(() => {
    const unsubNew = on("new_order", ({ order: newOrder }) => {
      setOrders((prev) => [newOrder, ...prev]);
      setNewOrderAlert(true);
      addToast("🔔 New order received!", "info");
      setTimeout(() => setNewOrderAlert(false), 10_000);
    });
    const unsubUpd = on("order_updated", ({ orderId, status }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o))
      );
    });
    return () => {
      if (typeof unsubNew === "function") unsubNew();
      if (typeof unsubUpd === "function") unsubUpd();
    };
  }, [on, addToast]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      addToast(err.response?.data?.message || "Invalid transition", "error");
      return;
    }
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    const vis = STATUS_VISUAL[newStatus];
    addToast(`Order → ${vis?.label || newStatus}`, "success");
  };

  const STATUS_TABS = [
    { id: "all",              label: "All",          count: orders.length },
    { id: "pending",          label: "New",          count: orders.filter(o => o.status === "pending").length },
    { id: "active",           label: "Active",       count: orders.filter(o => !["delivered","cancelled","out_for_delivery"].includes(o.status)).length },
    { id: "out_for_delivery", label: "Out",          count: orders.filter(o => o.status === "out_for_delivery").length },
    { id: "delivered",        label: "Done",         count: orders.filter(o => o.status === "delivered").length },
    { id: "cancelled",        label: "Cancelled",    count: orders.filter(o => o.status === "cancelled").length },
  ];

  const filtered = orders.filter(o => {
    const matchSearch = !search
      || (o.userId?.name || "").toLowerCase().includes(search.toLowerCase())
      || (o.items || []).some(i => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus =
      statusFilter === "all"              ? true :
      statusFilter === "active"           ? !["delivered","cancelled","out_for_delivery"].includes(o.status) :
      o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.totalPrice, 0);

  if (error === "no_store") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Create your store first</h2>
          <Link to="/store/settings" className="btn btn-brand">Create Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/store/dashboard"
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>All Orders</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Total revenue: ₹{revenue.toLocaleString()}
            </p>
          </div>

          {/* Store category badge */}
          <span
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl"
            style={{
              background: storeCategory === "Food" ? "rgba(249,115,22,0.1)" : "rgba(6,182,212,0.1)",
              color:      storeCategory === "Food" ? "#f97316"               : "#06b6d4",
              border: `1px solid ${storeCategory === "Food" ? "rgba(249,115,22,0.2)" : "rgba(6,182,212,0.2)"}`,
            }}
          >
            {storeCategory === "Food" ? "🍛 Food" : "📦 Grocery"}
          </span>

          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* New order alert */}
        {newOrderAlert && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer"
            style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)" }}
            onClick={() => { setStatusFilter("pending"); setNewOrderAlert(false); }}
          >
            <Bell size={16} style={{ color: "#f59e0b" }} />
            <p className="font-bold text-sm flex-1" style={{ color: "#f59e0b" }}>
              New order received — tap to view
            </p>
          </div>
        )}

        {/* Store role info banner */}
        <div
          className="rounded-xl p-3.5 mb-4 flex items-start gap-2.5 text-xs"
          style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", color: "#3b82f6" }}
        >
          <span className="flex-shrink-0 mt-0.5">ℹ️</span>
          <div>
            <span className="font-semibold">Your role: </span>
            Advance orders until{" "}
            <strong>{storeCategory === "Food" ? "Ready for Pickup" : "Packing"}</strong>.
            After that, a delivery partner takes over.
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            className="input-theme pl-10 text-sm py-2.5"
            placeholder="Search by customer or item…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {STATUS_TABS.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: statusFilter === id ? "var(--brand)" : "var(--elevated)",
                color:      statusFilter === id ? "white"         : "var(--text-muted)",
                border: `1px solid ${statusFilter === id ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              {label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{
                    background: statusFilter === id ? "rgba(255,255,255,0.2)" : "var(--border)",
                    color:      statusFilter === id ? "white"                  : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && error !== "no_store" && (
          <div
            className="rounded-2xl p-4 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error} <button onClick={() => fetchData()} className="ml-2 underline">Retry</button>
          </div>
        )}

        {/* Order list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-20 shimmer" style={{ backgroundColor: "var(--card)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No orders found"
            subtitle={orders.length === 0
              ? "Orders will appear here once customers start ordering"
              : "No orders match your current filter"}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <OrderRow
                key={order._id}
                order={order}
                storeCategory={storeCategory}
                onStatusUpdate={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}