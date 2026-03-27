import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck, MapPin, DollarSign, Package, Clock, Check,
  ToggleLeft, ToggleRight, RefreshCw, Navigation, ChevronRight,
  Star, Zap, TrendingUp, Phone, LogOut, Bike, AlertCircle,
  Bell, CheckCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

const DEMO_AVAILABLE = [
  {
    _id: "av1", totalPrice: 245, deliveryFee: 35,
    storeId: { name: "FreshMart Express", address: "Koramangala 5th Block", phone: "+91 98765 43210" },
    userId:  { name: "Raj Kumar", phone: "+91 87654 32109", address: "12, 3rd Main, HSR Layout" },
    items:   [{ name: "Amul Milk" }, { name: "Bread" }, { name: "Eggs" }],
    createdAt: new Date().toISOString(),
    distanceKm: 2.4,
  },
  {
    _id: "av2", totalPrice: 360, deliveryFee: 40,
    storeId: { name: "Biryani House", address: "Indiranagar, 100ft Rd", phone: "+91 76543 21098" },
    userId:  { name: "Priya Singh", phone: "+91 65432 10987", address: "77, 8th Main, Indiranagar" },
    items:   [{ name: "Chicken Biryani" }, { name: "Raita" }, { name: "Gulab Jamun" }],
    createdAt: new Date(Date.now() - 300000).toISOString(),
    distanceKm: 1.8,
  },
];

const DEMO_STATS = {
  totalDeliveries: 142,
  rating: 4.8,
  earningsToday: 340,
  earningsWeek: 2140,
  earningsMonth: 8450,
  completionRate: 98,
};

function OrderAvailableCard({ order, onAccept, accepting }) {
  const timeSince = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);

  return (
    <div className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--card)", border: "1.5px solid rgba(255,107,53,0.2)" }}>

      {/* Urgency indicator */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>New Order</span>
        </div>
        <div className="flex items-center gap-2">
          {timeSince < 2 && (
            <span className="tag tag-brand text-[10px]"><Zap size={9} /> Just now</span>
          )}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {timeSince < 1 ? "Just now" : `${timeSince}m ago`}
          </span>
        </div>
      </div>

      {/* Route */}
      <div className="px-5 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "#22c55e", background: "rgba(34,197,94,0.2)" }} />
            <div className="w-0.5 h-8 rounded-full" style={{ background: "var(--border)" }} />
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "var(--brand)", background: "rgba(255,107,53,0.2)" }} />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {order.storeId?.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.storeId?.address}</p>
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {order.userId?.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.userId?.address}</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-xl" style={{ color: "var(--brand)" }}>₹{order.deliveryFee || 30}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {order.distanceKm ? `${order.distanceKm} km` : "~2 km"}
            </p>
          </div>
        </div>

        {/* Items + order value */}
        <div className="flex items-center gap-2 flex-wrap mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: "var(--elevated)" }}>
            🛍️ {order.items?.length || 0} items
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ background: "var(--elevated)" }}>
            💰 ₹{order.totalPrice} order
          </span>
          {order.storeId?.phone && (
            <a href={`tel:${order.storeId.phone}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
              <Phone size={10} /> Call
            </a>
          )}
        </div>

        <button
          onClick={() => onAccept(order._id)}
          disabled={accepting === order._id}
          className="btn btn-brand w-full justify-center py-3 text-sm"
          style={{ boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
          {accepting === order._id
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Check size={15} /> Accept Delivery · ₹{order.deliveryFee || 30}</>}
        </button>
      </div>
    </div>
  );
}

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const { addToast, clearCart } = useCart();
  const navigate = useNavigate();
  const pollRef = useRef(null);

  const [available,  setAvailable]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline,   setIsOnline]   = useState(user?.isAvailable ?? true);
  const [stats,      setStats]      = useState(DEMO_STATS);
  const [accepting,  setAccepting]  = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { fetchData(); }, []);

  // Auto-poll for new orders every 20s when online
  useEffect(() => {
    if (isOnline) {
      pollRef.current = setInterval(() => fetchData(true), 20000);
    } else {
      clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [isOnline]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get("/orders/delivery/available");
      setAvailable(data);
      setLastRefresh(new Date());
    } catch {
      setAvailable(isOnline ? DEMO_AVAILABLE : []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleOnline = async () => {
    try { await api.patch("/auth/availability"); } catch {}
    const next = !isOnline;
    setIsOnline(next);
    addToast(next ? "You're now online! 🟢" : "You're now offline", next ? "success" : "info");
    if (!next) setAvailable([]);
    else fetchData(true);
  };

  const acceptDelivery = async (orderId) => {
    setAccepting(orderId);
    try {
      await api.post(`/orders/${orderId}/accept`);
      addToast("Delivery accepted! 🎉 Head to the store.", "success");
      navigate("/delivery/active");
    } catch {
      // Demo mode
      addToast("Delivery accepted! 🎉 Head to the store.", "success");
      navigate("/delivery/active");
    } finally {
      setAccepting(null);
    }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    navigate("/login");
  };

  const vehicleEmoji = { bike: "🏍️", scooter: "🛵", cycle: "🚲" }[user?.vehicleType] || "🛵";

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              {vehicleEmoji} Hey {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user?.vehicleType || "Delivery"} Partner
              {user?.rating && <> · ⭐ {user.rating}</>}
            </p>
          </div>
          <button onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Online / Offline Toggle */}
        <div className="rounded-2xl p-5 mb-4 transition-all"
          style={{
            background: isOnline
              ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))"
              : "var(--card)",
            border: `1.5px solid ${isOnline ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
          }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: isOnline ? "rgba(34,197,94,0.15)" : "var(--elevated)" }}>
              {vehicleEmoji}
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                {isOnline ? "🟢 You're Online" : "🔴 You're Offline"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {isOnline
                  ? `Receiving new orders · Last updated ${Math.floor((Date.now() - lastRefresh) / 1000)}s ago`
                  : "Toggle on to start receiving orders"}
              </p>
            </div>
            <button onClick={toggleOnline}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{
                background: isOnline ? "rgba(34,197,94,0.15)" : "var(--elevated)",
                color: isOnline ? "#22c55e" : "var(--text-muted)",
                border: `1px solid ${isOnline ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
              }}>
              {isOnline ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {isOnline ? "Online" : "Go Online"}
            </button>
          </div>
        </div>

        {/* Earnings Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Today",  value: `₹${stats.earningsToday}`,   icon: DollarSign,  color: "var(--brand)",  sub: `${Math.round(stats.earningsToday / 30)} deliveries` },
            { label: "This Week", value: `₹${stats.earningsWeek}`, icon: TrendingUp,  color: "#22c55e",       sub: "Last 7 days" },
            { label: "This Month", value: `₹${stats.earningsMonth}`,icon: TrendingUp, color: "#3b82f6",       sub: "Month total" },
            { label: "Rating",  value: `${stats.rating} ⭐`,        icon: Star,        color: "#f59e0b",       sub: `${stats.totalDeliveries} deliveries` },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color + "18" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-display font-black text-xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link to="/delivery/active"
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.15)" }}>
              <Navigation size={16} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--brand)" }}>Active Delivery</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current order</p>
            </div>
          </Link>
          <Link to="/delivery/history"
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.12)" }}>
              <Package size={16} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>History</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{stats.totalDeliveries} total</p>
            </div>
          </Link>
        </div>

        {/* Available Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              Available Orders
            </h2>
            {isOnline && available.length > 0 && (
              <span className="flex items-center gap-1 tag tag-green text-xs">
                <Zap size={11} /> {available.length} ready
              </span>
            )}
          </div>

          {!isOnline ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-5xl mb-3">💤</div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>You're offline</p>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Go online to see available orders</p>
              <button onClick={toggleOnline} className="btn btn-brand text-sm">
                Go Online
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-2xl h-44 shimmer" style={{ backgroundColor: "var(--card)" }} />
              ))}
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-5xl mb-3" style={{ animation: "float 3s ease-in-out infinite" }}>🔍</div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>No orders right now</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                New orders will appear here automatically
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Auto-refreshing every 20 seconds
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {available.map(order => (
                <OrderAvailableCard
                  key={order._id}
                  order={order}
                  onAccept={acceptDelivery}
                  accepting={accepting}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sign out */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm mt-6 transition-all hover:scale-[1.01]"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.18)" }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}