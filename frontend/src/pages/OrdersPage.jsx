import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, Clock, CheckCircle, Truck, XCircle, ChevronRight,
  RefreshCw, ShoppingBag, Zap, Circle
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { SkeletonCard, EmptyState } from "../components/ui/Skeleton";

const STATUS_CONFIG = {
  pending:          { label: "Pending",          color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: Clock,         emoji: "⏳" },
  confirmed:        { label: "Confirmed",         color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: CheckCircle,   emoji: "✅" },
  preparing:        { label: "Preparing",         color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: Package,       emoji: "👨‍🍳" },
  ready_for_pickup: { label: "Ready for Pickup",  color: "#f97316", bg: "rgba(249,115,22,0.12)", icon: Zap,           emoji: "📦" },
  out_for_delivery: { label: "Out for Delivery",  color: "#ff6b35", bg: "rgba(255,107,53,0.12)", icon: Truck,         emoji: "🛵" },
  delivered:        { label: "Delivered",         color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: CheckCircle,   emoji: "🎉" },
  cancelled:        { label: "Cancelled",         color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: XCircle,       emoji: "❌" },
};

const DEMO_ORDERS = [
  {
    _id: "o1",
    status: "delivered",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    storeId: { name: "FreshMart Express" },
    items: [{ name: "Amul Milk", quantity: 2 }, { name: "Bread", quantity: 1 }],
    totalPrice: 101,
    deliveryFee: 20,
    deliveryAddress: "Koramangala, Bengaluru",
    paymentMethod: "cod",
  },
  {
    _id: "o2",
    status: "out_for_delivery",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    storeId: { name: "Biryani House" },
    items: [{ name: "Chicken Biryani", quantity: 2 }],
    totalPrice: 360,
    deliveryFee: 20,
    deliveryAddress: "Indiranagar, Bengaluru",
    paymentMethod: "cod",
  },
  {
    _id: "o3",
    status: "pending",
    createdAt: new Date().toISOString(),
    storeId: { name: "MedPlus Quick" },
    items: [{ name: "Paracetamol", quantity: 2 }, { name: "Cough Syrup", quantity: 1 }],
    totalPrice: 145,
    deliveryFee: 0,
    deliveryAddress: "HSR Layout, Bengaluru",
    paymentMethod: "online",
  },
];

const ACTIVE_STATUSES = ["pending", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery"];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | active | delivered | cancelled
  const { isLoggedIn } = useAuth();

  useEffect(() => { if (isLoggedIn) fetchOrders(); else setLoading(false); }, [isLoggedIn]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/my");
      setOrders(data);
    } catch {
      setOrders(DEMO_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    if (filter === "active")    return ACTIVE_STATUSES.includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    return true;
  });

  const activeCount    = orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;

  const TABS = [
    { id: "all",       label: "All",       count: orders.length },
    { id: "active",    label: "Active",    count: activeCount },
    { id: "delivered", label: "Delivered", count: deliveredCount },
  ];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen page-enter flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <EmptyState icon="🔒" title="Sign in required" subtitle="Please sign in to view your orders"
          action={<Link to="/login" className="btn btn-brand text-sm">Sign In</Link>} />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">

        {/* Header */}
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
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Active order banner */}
        {activeCount > 0 && (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3"
            style={{ background: "rgba(255,107,53,0.08)", border: "1.5px solid rgba(255,107,53,0.2)" }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: "var(--brand)", animation: "pulseDot 1.5s infinite" }} />
            <p className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
              {activeCount} order{activeCount > 1 ? "s" : ""} in progress
            </p>
            <button onClick={() => setFilter("active")}
              className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
              View →
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, count }) => (
            <button key={id} onClick={() => setFilter(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === id ? "var(--brand)" : "var(--elevated)",
                color: filter === id ? "white" : "var(--text-muted)",
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

        {/* Orders list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📦" title="No orders found"
            subtitle={filter !== "all" ? "Nothing in this category" : "Your past and current orders will appear here"}
            action={<Link to="/user/home" className="btn btn-brand text-sm">Browse Stores</Link>} />
        ) : (
          <div className="space-y-3 stagger">
            {filtered.map(order => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const Icon = sc.icon;
              const date = new Date(order.createdAt);
              const isActive = ACTIVE_STATUSES.includes(order.status);
              const itemCount = order.items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0;

              return (
                <div key={order._id}
                  className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--card)",
                    border: `1px solid ${isActive ? "rgba(255,107,53,0.2)" : "var(--border)"}`,
                  }}>
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: "var(--elevated)" }}>
                          {sc.emoji}
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                            {order.storeId?.name || "Store"}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {" · "}
                            {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="flex items-center gap-1.5 tag text-xs" style={{ background: sc.bg, color: sc.color }}>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.color }} />}
                          <Icon size={11} />
                          {sc.label}
                        </span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                      {order.items?.slice(0, 3).map(i => i.name).join(", ")}
                      {order.items?.length > 3 && ` +${order.items.length - 3} more`}
                    </p>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-3 border-t"
                      style={{ borderColor: "var(--border)" }}>
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
                      <div className="flex items-center gap-2">
                        {order.status === "delivered" && (
                          <button className="btn btn-ghost text-xs py-1.5 px-3">Reorder</button>
                        )}
                        {/* ✅ Fixed link: was /order/${id}, now /user/orders/${id} */}
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