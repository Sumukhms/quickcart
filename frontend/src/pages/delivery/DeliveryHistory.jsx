import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Package, TrendingUp, DollarSign, Star,
  Clock, ChevronDown, ChevronUp, RefreshCw, Calendar, Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { orderAPI } from "../../api/api";
import { EmptyState } from "../../components/ui/Skeleton";

function DeliveryCard({ delivery }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(delivery.createdAt);
  const fee  = delivery.deliveryFee || 30;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.1)" }}
        >
          ✅
        </div>
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
        {expanded
          ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
          : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
        }
      </div>

      {expanded && (
        <div className="px-5 pb-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Delivery to</span>
              <span style={{ color: "var(--text-secondary)" }}>{delivery.userId?.address || delivery.deliveryAddress || "—"}</span>
            </div>
            {delivery.items?.length > 0 && (
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Items</span>
                <span style={{ color: "var(--text-secondary)" }}>{delivery.items.map(i => i.name).join(", ")}</span>
              </div>
            )}
            <div
              className="flex justify-between font-bold pt-1"
              style={{ borderTop: "1px solid var(--border)" }}
            >
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
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState("all");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const { data } = await orderAPI.getMyDeliveries({ status: "delivered" });
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load delivery history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart   = new Date(now - 7 * 86_400_000);
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

  const filtered = deliveries.filter(d => {
    const t = new Date(d.createdAt);
    if (filter === "today") return t >= todayStart;
    if (filter === "week")  return t >= weekStart;
    if (filter === "month") return t >= monthStart;
    return true;
  });

  const fee = (d) => d.deliveryFee || 30;
  const totalEarnings  = filtered.reduce((s, d) => s + fee(d), 0);
  const todayEarnings  = deliveries.filter(d => new Date(d.createdAt) >= todayStart).reduce((s, d) => s + fee(d), 0);
  const weekEarnings   = deliveries.filter(d => new Date(d.createdAt) >= weekStart).reduce((s, d) => s + fee(d), 0);
  const monthEarnings  = deliveries.filter(d => new Date(d.createdAt) >= monthStart).reduce((s, d) => s + fee(d), 0);

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/delivery/dashboard"
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              Delivery History
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {deliveries.length} total deliveries
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Today",       value: `₹${todayEarnings}`,  sub: `${deliveries.filter(d => new Date(d.createdAt) >= todayStart).length} deliveries`,   color: "var(--brand)" },
            { label: "This Week",   value: `₹${weekEarnings}`,   sub: `${deliveries.filter(d => new Date(d.createdAt) >= weekStart).length} deliveries`,    color: "#3b82f6" },
            { label: "This Month",  value: `₹${monthEarnings}`,  sub: `${deliveries.filter(d => new Date(d.createdAt) >= monthStart).length} deliveries`,   color: "#22c55e" },
            { label: "All Time",    value: `₹${deliveries.reduce((s,d) => s+fee(d), 0)}`, sub: `${deliveries.length} deliveries`, color: "#8b5cf6" },
          ].map(({ label, value, sub, color }) => (
            <div
              key={label}
              className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
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
            { id: "week",  label: "This Week", icon: Calendar },
            { id: "month", label: "Month",    icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === id ? "var(--brand)" : "var(--elevated)",
                color: filter === id ? "white" : "var(--text-muted)",
                border: `1px solid ${filter === id ? "var(--brand)" : "var(--border)"}`,
              }}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-2xl p-4 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
            <button onClick={() => fetchData()} className="ml-2 underline">Retry</button>
          </div>
        )}

        {/* Deliveries List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-20 shimmer" style={{ backgroundColor: "var(--card)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No deliveries yet"
            subtitle={filter !== "all" ? "Try a different time period" : "Complete deliveries to see your history here"}
            action={<Link to="/delivery/dashboard" className="btn btn-brand text-sm">Find Orders</Link>}
          />
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