import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck, MapPin, DollarSign, Package, Clock, Check,
  ToggleLeft, ToggleRight, RefreshCw, Navigation, ChevronRight,
  Star, Zap, TrendingUp, Phone, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

const DEMO_AVAILABLE = [
  { _id: "av1", totalPrice: 245, deliveryFee: 30, storeId: { name: "FreshMart Express", address: "Koramangala 5th Block", phone: "+91 98765 43210" }, userId: { name: "Raj Kumar", phone: "+91 87654 32109", address: "12, 3rd Main, HSR Layout" }, items: [{ name: "Amul Milk" }, { name: "Bread" }, { name: "Eggs" }], createdAt: new Date().toISOString() },
  { _id: "av2", totalPrice: 180, deliveryFee: 25, storeId: { name: "Biryani House",     address: "Indiranagar, 100ft Rd",  phone: "+91 76543 21098" }, userId: { name: "Priya Singh",  phone: "+91 65432 10987", address: "77, 8th Main, Indiranagar" },  items: [{ name: "Chicken Biryani" }, { name: "Raita" }],             createdAt: new Date(Date.now()-600000).toISOString() },
];

const DEMO_STATS = { totalDeliveries: 142, rating: 4.8, earningsToday: 340, earningsMonth: 8450 };

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const { addToast, clearCart } = useCart();
  const navigate = useNavigate();

  const [available,  setAvailable]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline,   setIsOnline]   = useState(true);
  const [stats,      setStats]      = useState(DEMO_STATS);
  const [accepting,  setAccepting]  = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [availRes] = await Promise.all([
        api.get("/orders/delivery/available"),
      ]);
      setAvailable(availRes.data);
    } catch {
      setAvailable(isOnline ? DEMO_AVAILABLE : []);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const toggleOnline = async () => {
    try {
      await api.patch("/auth/availability");
    } catch {}
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
      addToast("Delivery accepted! 🎉", "success");
      navigate("/delivery/active");
    } catch {
      addToast("Order accepted (demo)!", "success");
      navigate("/delivery/active");
    } finally { setAccepting(null); }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    navigate("/login");
  };

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              Hey {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user?.vehicleType ? `${user.vehicleType} · ` : ""}Delivery Partner
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchData(true)} className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Online/Offline Toggle */}
        <div className="rounded-2xl p-5 mb-5 flex items-center gap-4"
          style={{
            background: isOnline ? "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))" : "var(--card)",
            border: `1.5px solid ${isOnline ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
          }}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${isOnline ? "" : "opacity-50"}`}
            style={{ background: isOnline ? "rgba(34,197,94,0.15)" : "var(--elevated)" }}>
            🛵
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>
              {isOnline ? "You're Online" : "You're Offline"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {isOnline ? "Available for new deliveries" : "Not receiving new orders"}
            </p>
          </div>
          <button onClick={toggleOnline}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: isOnline ? "rgba(34,197,94,0.15)" : "var(--elevated)",
              color: isOnline ? "#22c55e" : "var(--text-muted)",
              border: `1px solid ${isOnline ? "rgba(34,197,94,0.2)" : "var(--border)"}`,
            }}>
            {isOnline ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {isOnline ? "Online" : "Go Online"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Today's Earnings",  value: `₹${stats.earningsToday}`,  icon: DollarSign, color: "var(--brand)" },
            { label: "Total Deliveries",  value: stats.totalDeliveries,       icon: Package,    color: "#3b82f6" },
            { label: "Monthly Earnings",  value: `₹${stats.earningsMonth}`,  icon: TrendingUp, color: "#22c55e" },
            { label: "Your Rating",       value: `${stats.rating} ⭐`,        icon: Star,       color: "#f59e0b" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color + "15" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-display font-black text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/delivery/active"
            className="flex items-center gap-2.5 p-4 rounded-2xl transition-all hover:scale-105"
            style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)" }}>
            <Navigation size={18} style={{ color: "var(--brand)" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--brand)" }}>Active Delivery</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Track your current</p>
            </div>
          </Link>
          <Link to="/delivery/history"
            className="flex items-center gap-2.5 p-4 rounded-2xl transition-all hover:scale-105"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Package size={18} style={{ color: "#3b82f6" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>History</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Past deliveries</p>
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
              <div className="text-4xl mb-3">💤</div>
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>You're offline</p>
              <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>Go online to see available orders</p>
              <button onClick={toggleOnline} className="btn btn-brand text-sm">Go Online</button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-2xl h-40 shimmer" style={{ backgroundColor: "var(--card)" }} />
              ))}
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-4xl mb-3" style={{ animation: "float 3s ease-in-out infinite" }}>🔍</div>
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No orders available</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>New orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {available.map(order => (
                <div key={order._id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--card)", border: "1.5px solid rgba(255,107,53,0.2)" }}>

                  {/* Store → Customer route */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                        <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
                        <div className="w-0.5 h-8 rounded-full" style={{ background: "var(--border)" }} />
                        <div className="w-3 h-3 rounded-full" style={{ background: "var(--brand)" }} />
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
                        <p className="font-bold text-lg" style={{ color: "var(--brand)" }}>₹{order.deliveryFee || 30}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Earnings</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                      <span>🛍️ {order.items?.length || 0} items</span>
                      <span>·</span>
                      <span>💰 ₹{order.totalPrice} order</span>
                      <span>·</span>
                      <span>
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <button
                      onClick={() => acceptDelivery(order._id)}
                      disabled={accepting === order._id}
                      className="btn btn-brand w-full justify-center py-3 text-sm"
                      style={{ boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}>
                      {accepting === order._id
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Check size={15} /> Accept Delivery</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm mt-6 transition-all hover:scale-[1.01]"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.18)" }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}