import { useState, useEffect } from "react";
import { Link }                from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Search, Check, X,
  Phone, ChevronDown, ChevronUp, Package
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api          from "../../api/api";
// ── NEW: flow-aware helpers ────────────────────────────────────
import { STATUS_VISUAL, getNextStatusAction } from "../../utils/orderFlows";

// ─── Demo orders include a "packing" example ──────────────────
const DEMO_ORDERS = [
  {
    _id: "o1", status: "pending",   totalPrice: 245, deliveryFee: 20,
    createdAt: new Date().toISOString(),
    userId: { name: "Raj Kumar",    phone: "+91 98765 43210" },
    items: [{ name: "Amul Milk 500ml", quantity: 2, price: 28 }, { name: "Bread", quantity: 1, price: 45 }],
    deliveryAddress: "12, 3rd Main, Koramangala", paymentMethod: "cod",
  },
  {
    _id: "o2", status: "packing",   totalPrice: 180, deliveryFee: 20,
    createdAt: new Date(Date.now() - 1_800_000).toISOString(),
    userId: { name: "Priya Singh",  phone: "+91 87654 32109" },
    items: [{ name: "Basmati Rice 1kg", quantity: 1, price: 120 }, { name: "Tata Salt", quantity: 1, price: 22 }],
    deliveryAddress: "5B, 1st Cross, HSR Layout", paymentMethod: "cod",
  },
  {
    _id: "o3", status: "delivered", totalPrice: 320, deliveryFee: 20,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    userId: { name: "Arjun Mehta",  phone: "+91 76543 21098" },
    items: [{ name: "Mixed Veggies", quantity: 2, price: 80 }, { name: "Eggs 12pcs", quantity: 1, price: 90 }],
    deliveryAddress: "44, 8th Main, Indiranagar", paymentMethod: "online",
  },
  {
    _id: "o4", status: "confirmed", totalPrice: 95,  deliveryFee: 0,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
    userId: { name: "Sneha Patel",  phone: "+91 65432 10987" },
    items: [{ name: "Parle-G Biscuits", quantity: 3, price: 10 }, { name: "Sprite 750ml", quantity: 1, price: 45 }],
    deliveryAddress: "77, 2nd Phase, JP Nagar", paymentMethod: "cod",
  },
  {
    _id: "o5", status: "cancelled", totalPrice: 150, deliveryFee: 20,
    createdAt: new Date(Date.now() - 7_200_000).toISOString(),
    userId: { name: "Vikram Das",   phone: "+91 54321 09876" },
    items: [{ name: "Fortune Oil 1L", quantity: 1, price: 145 }],
    deliveryAddress: "9, 6th Sector, HSR Layout", paymentMethod: "cod",
  },
];

// ─── Order row ────────────────────────────────────────────────
function OrderRow({ order, storeCategory, onStatusUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const sc         = STATUS_VISUAL[order.status] || STATUS_VISUAL.pending;
  // ── Dynamic next action for this order's flow ─────────────
  const nextAction = getNextStatusAction(order.status, storeCategory);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Summary row */}
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
          <div className="flex items-center gap-2">
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

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Items */}
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

          {/* Meta */}
          <div className="flex flex-col gap-1.5 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>📍 {order.deliveryAddress}</span>
            {order.userId?.phone && (
              <a href={`tel:${order.userId.phone}`} className="flex items-center gap-1"
                style={{ color: "var(--brand)" }}>
                <Phone size={11} /> {order.userId.phone}
              </a>
            )}
            <span>💳 {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}</span>
          </div>

          {/* ── Flow-aware action buttons ─────────────────── */}
          {nextAction && order.status !== "cancelled" && (
            <div className="flex gap-2">
              <button
                onClick={() => onStatusUpdate(order._id, nextAction.nextStatus)}
                className="btn btn-brand text-xs py-2 flex-1 justify-center"
              >
                <Check size={12} /> {nextAction.emoji} {nextAction.label}
              </button>
              {order.status === "pending" && (
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

// ─── Main page ────────────────────────────────────────────────
export default function StoreOrders() {
  const { isLoggedIn } = useAuth();
  const { addToast }   = useCart();

  const [orders,       setOrders]       = useState([]);
  const [storeId,      setStoreId]      = useState(null);
  const [storeCategory, setStoreCategory] = useState("Other");
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data: store } = await api.get("/stores/mine");
      setStoreId(store._id);
      setStoreCategory(store.category || "Other");
      const { data } = await api.get(`/orders/store/${store._id}`, { params: { limit: 200 } });
      setOrders(data);
    } catch {
      // Demo fallback
      setStoreId("s1");
      setStoreCategory("Groceries");
      setOrders(DEMO_ORDERS);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      addToast(err.response?.data?.message || "Invalid transition", "error");
      return; // don't update local state if server rejected
    }
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    const vis = STATUS_VISUAL[newStatus];
    addToast(`Order → ${vis?.label || newStatus}`, "success");
  };

  // Status tabs — include "packing" in the active group
  const STATUS_TABS = [
    { id: "all",       label: "All",       count: orders.length },
    { id: "pending",   label: "New",       count: orders.filter(o => o.status === "pending").length },
    { id: "active",    label: "Active",    count: orders.filter(o => !["delivered","cancelled"].includes(o.status)).length },
    { id: "delivered", label: "Done",      count: orders.filter(o => o.status === "delivered").length },
    { id: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
  ];

  const filtered = orders.filter(o => {
    const matchSearch  = !search || (o.userId?.name || "").toLowerCase().includes(search.toLowerCase())
      || (o.items || []).some(i => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus  =
      statusFilter === "all"       ? true :
      statusFilter === "active"    ? !["delivered","cancelled"].includes(o.status) :
      o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.totalPrice, 0);

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
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Total revenue: ₹{revenue.toLocaleString()}</p>
          </div>
          {/* Flow badge */}
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

        {/* Order list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-20 shimmer" style={{ backgroundColor: "var(--card)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Package size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No orders found</p>
          </div>
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