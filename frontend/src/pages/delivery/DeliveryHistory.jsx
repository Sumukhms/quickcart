import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Package, TrendingUp, DollarSign, Star,
  Clock, ChevronDown, ChevronUp, RefreshCw, Filter, Calendar
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

const DEMO_DELIVERIES = [
  { _id: "d1", status: "delivered", totalPrice: 245, deliveryFee: 30, createdAt: new Date().toISOString(),                   storeId: { name: "FreshMart Express" }, userId: { name: "Raj Kumar",   address: "HSR Layout" },  items: [{ name: "Milk" }, { name: "Bread" }] },
  { _id: "d2", status: "delivered", totalPrice: 180, deliveryFee: 25, createdAt: new Date(Date.now()-3600000).toISOString(),  storeId: { name: "Biryani House" },     userId: { name: "Priya Singh", address: "Indiranagar" }, items: [{ name: "Biryani" }] },
  { _id: "d3", status: "delivered", totalPrice: 320, deliveryFee: 35, createdAt: new Date(Date.now()-86400000).toISOString(), storeId: { name: "MedPlus Quick" },     userId: { name: "Arjun Mehta",address: "Whitefield" },  items: [{ name: "Medicines" }] },
  { _id: "d4", status: "delivered", totalPrice: 90,  deliveryFee: 20, createdAt: new Date(Date.now()-172800000).toISOString(),storeId: { name: "Snack Attack" },      userId: { name: "Sneha Patel",address: "JP Nagar" },    items: [{ name: "Snacks" }] },
  { _id: "d5", status: "delivered", totalPrice: 430, deliveryFee: 40, createdAt: new Date(Date.now()-259200000).toISOString(),storeId: { name: "Daily Basket" },      userId: { name: "Vikram Das", address: "Koramangala" }, items: [{ name: "Groceries" }] },
];

function DeliveryCard({ delivery }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(delivery.createdAt);
  const fee  = delivery.deliveryFee || 30;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.1)" }}>✅</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {delivery.storeId?.name} → {delivery.userId?.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="text-right flex-shrink-0 mr-1">
          <p className="font-bold text-sm" style={{ color: "#22c55e" }}>+₹{fee}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Order ₹{delivery.totalPrice}</p>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
      </div>

      {expanded && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Delivery to</span>
              <span style={{ color: "var(--text-secondary)" }}>{delivery.userId?.address}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Items</span>
              <span style={{ color: "var(--text-secondary)" }}>{delivery.items?.map(i => i.name).join(", ")}</span>
            </div>
            <div className="flex justify-between font-bold pt-1"
              style={{ borderTop: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-muted)" }}>Your earnings</span>
              <span style={{ color: "#22c55e" }}>₹{fee}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeliveryHistory() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState("all"); // all, today, week, month

  useEffect(() => { fetchData(); }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get("/orders/delivery/mine", { params: { status: "delivered" } });
      setDeliveries(data);
    } catch {
      setDeliveries(DEMO_DELIVERIES);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const now = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(now - 7 * 86400000);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = deliveries.filter(d => {
    const t = new Date(d.createdAt);
    if (filter === "today") return t >= todayStart;
    if (filter === "week")  return t >= weekStart;
    if (filter === "month") return t >= monthStart;
    return true;
  });

  const totalEarnings  = filtered.reduce((s, d) => s + (d.deliveryFee || 30), 0);
  const todayEarnings  = deliveries.filter(d => new Date(d.createdAt) >= todayStart).reduce((s, d) => s + (d.deliveryFee || 30), 0);
  const weekEarnings   = deliveries.filter(d => new Date(d.createdAt) >= weekStart).reduce((s, d) => s + (d.deliveryFee || 30), 0);
  const monthEarnings  = deliveries.filter(d => new Date(d.createdAt) >= monthStart).reduce((s, d) => s + (d.deliveryFee || 30), 0);

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/delivery/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Delivery History</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{deliveries.length} total deliveries</p>
          </div>
          <button onClick={() => fetchData(true)} className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Today",       value: `₹${todayEarnings}`,  sub: `${deliveries.filter(d => new Date(d.createdAt) >= todayStart).length} deliveries`,  color: "var(--brand)" },
            { label: "This Week",   value: `₹${weekEarnings}`,   sub: `${deliveries.filter(d => new Date(d.createdAt) >= weekStart).length} deliveries`,   color: "#3b82f6" },
            { label: "This Month",  value: `₹${monthEarnings}`,  sub: `${deliveries.filter(d => new Date(d.createdAt) >= monthStart).length} deliveries`,  color: "#22c55e" },
            { label: "All Time",    value: `₹${deliveries.reduce((s,d) => s+(d.deliveryFee||30), 0)}`,sub: `${deliveries.length} deliveries`, color: "#8b5cf6" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="font-display font-black text-xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
          {[
            { id: "all",   label: "All Time", icon: Package },
            { id: "today", label: "Today",    icon: Clock },
            { id: "week",  label: "This Week",icon: Calendar },
            { id: "month", label: "Month",    icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setFilter(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === id ? "var(--brand)" : "var(--elevated)",
                color: filter === id ? "white" : "var(--text-muted)",
                border: `1px solid ${filter === id ? "var(--brand)" : "var(--border)"}`,
              }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* Deliveries List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-20 shimmer" style={{ backgroundColor: "var(--card)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-5xl mb-3">📦</div>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No deliveries yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {filter !== "all" ? "Try a different time period" : "Complete deliveries to see history"}
            </p>
            <Link to="/delivery/dashboard" className="btn btn-brand text-sm mt-4">Find Orders</Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {filtered.length} deliveries · ₹{totalEarnings} earned
              </p>
            </div>
            <div className="space-y-3">
              {filtered.map(d => <DeliveryCard key={d._id} delivery={d} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}