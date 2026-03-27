import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, TrendingUp, ShoppingBag, Clock, Check, X,
  DollarSign, BarChart3, RefreshCw, Bell, Store, AlertCircle,
  ChevronRight, Zap, Users, ArrowUp
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

const STATUS_COLORS = {
  pending:          { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Pending" },
  confirmed:        { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "Confirmed" },
  preparing:        { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  label: "Preparing" },
  ready_for_pickup: { color: "#f97316", bg: "rgba(249,115,22,0.12)",  label: "Ready" },
  out_for_delivery: { color: "#f97316", bg: "rgba(249,115,22,0.12)",  label: "Out for Delivery" },
  delivered:        { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   label: "Delivered" },
  cancelled:        { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "Cancelled" },
};

const NEXT_STATUS = {
  pending:          "confirmed",
  confirmed:        "preparing",
  preparing:        "ready_for_pickup",
  ready_for_pickup: "out_for_delivery",
  out_for_delivery: "delivered",
};

const DEMO_STORE    = { _id: "s1", name: "My Demo Store", category: "Groceries", isOpen: true, rating: 4.7, totalRatings: 234 };
const DEMO_ORDERS   = [
  { _id: "o1", status: "pending",   totalPrice: 245, createdAt: new Date().toISOString(),userId: { name: "Raj Kumar",    phone: "+91 98765 43210" }, items: [{ name: "Milk" }, { name: "Bread" }], deliveryAddress: "Koramangala" },
  { _id: "o2", status: "preparing", totalPrice: 180, createdAt: new Date(Date.now()-1800000).toISOString(), userId: { name: "Priya Singh",  phone: "+91 87654 32109" }, items: [{ name: "Rice 1kg" }], deliveryAddress: "HSR Layout" },
  { _id: "o3", status: "delivered", totalPrice: 320, createdAt: new Date(Date.now()-86400000).toISOString(), userId: { name: "Arjun Mehta", phone: "+91 76543 21098" }, items: [{ name: "Veggies"}],deliveryAddress: "Indiranagar" },
];

function OrderCard({ order, onStatusUpdate }) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--card)", border: `1px solid var(--border)` }}>

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)" }}>
            {order.userId?.name?.[0] || "C"}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {order.userId?.name || "Customer"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              {order.userId?.phone && ` · ${order.userId.phone}`}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base" style={{ color: "var(--brand)" }}>₹{order.totalPrice}</p>
          <span className="tag text-[10px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
        </div>
      </div>

      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        📍 {order.deliveryAddress}
      </p>
      <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
        {order.items?.map(i => i.name).join(", ").slice(0, 60)}{order.items?.length > 2 ? "..." : ""}
      </p>

      {nextStatus && order.status !== "cancelled" && (
        <div className="flex gap-2">
          <button onClick={() => onStatusUpdate(order._id, nextStatus)}
            className="btn btn-brand text-xs py-2 px-3 flex-1 justify-center">
            <Check size={12} /> → {STATUS_COLORS[nextStatus]?.label}
          </button>
          {order.status === "pending" && (
            <button onClick={() => onStatusUpdate(order._id, "cancelled")}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function StoreDashboard() {
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();

  const [store, setStore]     = useState(null);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [refreshing, setRefreshing] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);

  useEffect(() => {
    if (isLoggedIn && user?.role === "store") fetchDashboardData();
  }, [isLoggedIn, user]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const storeRes = await api.get("/stores/mine");
      setStore(storeRes.data);
      setStoreOpen(storeRes.data.isOpen);
      const { data } = await api.get(`/orders/store/${storeRes.data._id}`, { params: { limit: 100 } });
      setOrders(data);
    } catch {
      setStore(DEMO_STORE);
      setOrders(DEMO_ORDERS);
      setStoreOpen(DEMO_STORE.isOpen);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      addToast(`Order → ${STATUS_COLORS[newStatus]?.label}`, "success");
    } catch {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      addToast(`Order → ${STATUS_COLORS[newStatus]?.label}`, "success");
    }
  };

  const toggleStoreOpen = async () => {
    try {
      await api.put(`/stores/${store?._id}`, { isOpen: !storeOpen });
    } catch {}
    setStoreOpen(v => !v);
    addToast(storeOpen ? "Store closed" : "Store is now open!", storeOpen ? "warning" : "success");
  };

  if (!isLoggedIn || user?.role !== "store") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Store owners only</h2>
          <Link to="/login" className="btn btn-brand">Sign In</Link>
        </div>
      </div>
    );
  }

  const pendingOrders   = orders.filter(o => o.status === "pending");
  const activeOrders    = orders.filter(o => !["delivered","cancelled"].includes(o.status));
  const todayRevenue    = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== "cancelled")
    .reduce((s, o) => s + o.totalPrice, 0);
  const totalRevenue    = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.totalPrice, 0);

  const filteredOrders = statusFilter === "active"
    ? activeOrders
    : statusFilter === "pending"
    ? pendingOrders
    : statusFilter === "delivered"
    ? orders.filter(o => o.status === "delivered")
    : orders;

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              {loading ? "Dashboard" : store?.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={toggleStoreOpen}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                style={{
                  background: storeOpen ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                  color: storeOpen ? "#22c55e" : "#ef4444",
                }}>
                <span className={`w-1.5 h-1.5 rounded-full ${storeOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                {storeOpen ? "Open" : "Closed"} — tap to toggle
              </button>
            </div>
          </div>
          <button onClick={() => fetchDashboardData(true)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* New Order Alert */}
        {pendingOrders.length > 0 && (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)" }}
            onClick={() => setStatusFilter("pending")}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.2)" }}>
              <Bell size={15} style={{ color: "#f59e0b" }} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#f59e0b" }}>
                {pendingOrders.length} new order{pendingOrders.length > 1 ? "s" : ""} waiting!
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tap to review and accept</p>
            </div>
            <ChevronRight size={16} style={{ color: "#f59e0b" }} />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today's Revenue", value: `₹${todayRevenue}`,     icon: DollarSign, color: "var(--brand)",  change: "+12%" },
            { label: "Active Orders",   value: activeOrders.length,    icon: ShoppingBag,color: "#3b82f6",        change: `${pendingOrders.length} new` },
            { label: "Total Delivered", value: orders.filter(o=>o.status==="delivered").length, icon: Package, color: "#22c55e", change: "All time" },
            { label: "Total Revenue",   value: `₹${totalRevenue}`,     icon: TrendingUp, color: "#8b5cf6",       change: "All time" },
          ].map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-1 cursor-pointer"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + "15" }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{ background: color + "15", color }}>
                  {change}
                </span>
              </div>
              <p className="font-display font-black text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { to: "/store/products", icon: Package, label: "Products", color: "var(--brand)" },
            { to: "/store/orders",   icon: ShoppingBag, label: "All Orders", color: "#3b82f6" },
            { to: "/store/settings", icon: Store, label: "Settings",  color: "#8b5cf6" },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: color + "12", color, border: `1px solid ${color}30` }}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </div>

        {/* Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>Orders</h2>
            <div className="flex gap-1">
              {[
                { id: "active",   label: "Active" },
                { id: "pending",  label: "New" },
                { id: "all",      label: "All" },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setStatusFilter(id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: statusFilter === id ? "var(--brand)" : "var(--elevated)",
                    color: statusFilter === id ? "white" : "var(--text-muted)",
                  }}>
                  {label}
                  {id === "pending" && pendingOrders.length > 0 && (
                    <span className="ml-1 w-4 h-4 rounded-full text-[10px] inline-flex items-center justify-center"
                      style={{ background: statusFilter === id ? "rgba(255,255,255,0.25)" : "#f59e0b", color: "white" }}>
                      {pendingOrders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl p-5 h-28 shimmer" style={{ backgroundColor: "var(--card)" }} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-4xl mb-3">📦</div>
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No orders here</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>New orders will appear automatically</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderCard key={order._id} order={order} onStatusUpdate={updateOrderStatus} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}