/**
 * DeliveryDashboard.jsx — UPDATED
 *
 * New features vs original:
 *   1. Earnings Wallet card — shows total, today, week, month
 *   2. "Request Payout" button — POSTs to /api/delivery/payout/request
 *   3. Payout status badge — shows pending/processed state
 *   4. All existing features preserved (online toggle, available orders, socket, etc.)
 *
 * The payout is a DB-flag only — no real payment processing.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Truck, MapPin, DollarSign, Package, Check,
  ToggleLeft, ToggleRight, RefreshCw, Navigation, ChevronRight,
  Star, Zap, TrendingUp, LogOut, Loader2, Wallet,
  Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import { useAuth }   from "../../context/AuthContext";
import { useCart }   from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { orderAPI, authAPI } from "../../api/api";
import api from "../../api/api";
import { STATUS_VISUAL } from "../../utils/orderFlows";

// ─── Available order card (unchanged from original) ──────────
function OrderAvailableCard({ order, onAccept, accepting }) {
  const timeSince = Math.floor((Date.now() - new Date(order.createdAt)) / 60_000);
  const triggerVis = STATUS_VISUAL[order.status] || STATUS_VISUAL.ready_for_pickup;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--card)", border: "1.5px solid rgba(255,107,53,0.2)" }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Available</span>
          <span
            className="tag text-[10px]"
            style={{ background: triggerVis.bg, color: triggerVis.color }}
          >
            {triggerVis.emoji} {triggerVis.label}
          </span>
        </div>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {timeSince < 1 ? "Just now" : `${timeSince}m ago`}
        </span>
      </div>

      <div className="px-5 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
            <div className="w-3 h-3 rounded-full border-2"
              style={{ borderColor: "#22c55e", background: "rgba(34,197,94,0.2)" }} />
            <div className="w-0.5 h-8 rounded-full" style={{ background: "var(--border)" }} />
            <div className="w-3 h-3 rounded-full border-2"
              style={{ borderColor: "var(--brand)", background: "rgba(255,107,53,0.2)" }} />
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
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {order.userId?.address || order.deliveryAddress}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-xl" style={{ color: "var(--brand)" }}>₹{order.deliveryFee || 30}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>earnings</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "var(--elevated)" }}>
            🛍️ {order.items?.length || 0} items
          </span>
          <span className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "var(--elevated)" }}>
            💰 ₹{order.totalPrice} order
          </span>
          {order.storeId?.category && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "var(--elevated)" }}>
              {order.storeId.category === "Food" ? "🍛" : "📦"} {order.storeId.category}
            </span>
          )}
          {order.paymentMethod === "cod" && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
              💵 Collect cash
            </span>
          )}
        </div>

        <button
          onClick={() => onAccept(order._id)}
          disabled={accepting === order._id}
          className="btn btn-brand w-full justify-center py-3 text-sm"
          style={{ boxShadow: "0 4px 16px rgba(255,107,53,0.3)" }}
        >
          {accepting === order._id
            ? <><Loader2 size={14} className="animate-spin" /> Accepting...</>
            : <><Check size={15} /> Accept · ₹{order.deliveryFee || 30}</>
          }
        </button>
      </div>
    </div>
  );
}

// ─── Earnings Wallet Card (NEW) ───────────────────────────────
function EarningsWallet({ earnings, onRequestPayout }) {
  const [requesting, setRequesting] = useState(false);
  const [payoutDone, setPayoutDone] = useState(false);

  const hasPending = !!earnings?.pendingPayout;

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await onRequestPayout();
      setPayoutDone(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(0,212,170,0.08), rgba(0,168,120,0.04))",
        border:     "1.5px solid rgba(0,212,170,0.25)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(0,212,170,0.15)" }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(0,212,170,0.15)" }}
        >
          <Wallet size={18} style={{ color: "#00d4aa" }} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Earnings Wallet</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your delivery earnings</p>
        </div>
        <div className="text-right">
          <p className="font-display font-black text-2xl" style={{ color: "#00d4aa" }}>
            ₹{earnings?.total || 0}
          </p>
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Total earned</p>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-3 divide-x px-0" style={{ borderBottom: "1px solid rgba(0,212,170,0.15)" }}>
        {[
          { label: "Today",      value: earnings?.todayEarnings || 0 },
          { label: "This Week",  value: earnings?.weekEarnings  || 0 },
          { label: "This Month", value: earnings?.monthEarnings || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 px-2"
            style={{ borderColor: "rgba(0,212,170,0.15)" }}>
            <p className="font-bold text-base" style={{ color: "var(--text-primary)" }}>₹{value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Payout section */}
      <div className="px-5 py-4">
        {hasPending || payoutDone ? (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl flex-1"
              style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}
            >
              <Clock size={13} />
              Payout request pending — processing in 2–3 business days
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 text-xs" style={{ color: "var(--text-muted)" }}>
              {earnings?.totalDeliveries || 0} deliveries completed
            </div>
            <button
              onClick={handleRequest}
              disabled={requesting || (earnings?.total || 0) < 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #00d4aa, #00a878)",
                color:      "#0b1012",
                boxShadow:  "0 4px 14px rgba(0,212,170,0.3)",
              }}
            >
              {requesting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <DollarSign size={14} />
              )}
              {requesting ? "Requesting…" : "Request Payout"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function DeliveryDashboard() {
  const { user, logout }        = useAuth();
  const { addToast, clearCart } = useCart();
  const { on }                  = useSocket();
  const navigate                = useNavigate();
  const pollRef                 = useRef(null);

  const [available,      setAvailable]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [isOnline,       setIsOnline]       = useState(user?.isAvailable ?? true);
  const [accepting,      setAccepting]      = useState(null);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [earnings,       setEarnings]       = useState(null);
  const [earningsLoading, setEarningsLoading] = useState(true);

  // ── Fetch available orders ────────────────────────────────
  const fetchAvailable = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await orderAPI.getAvailable();
      setAvailable(data);
    } catch (err) {
      if (!silent) addToast(err.response?.data?.message || "Failed to load orders", "error");
    } finally { setLoading(false); setRefreshing(false); }
  }, [addToast]);

  // ── Fetch earnings summary ────────────────────────────────
  const fetchEarnings = useCallback(async () => {
    setEarningsLoading(true);
    try {
      const { data } = await api.get("/delivery/earnings");
      setEarnings(data);
    } catch {
      // Fallback: compute client-side from delivery history
      try {
        const { data } = await orderAPI.getMyDeliveries({ status: "delivered" });
        const now         = new Date();
        const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart   = new Date(now - 7 * 86_400_000);
        const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
        const fee = (d) => d.deliveryFee || 30;
        setEarnings({
          totalDeliveries: data.length,
          total:           data.reduce((s, d) => s + fee(d), 0),
          todayEarnings:   data.filter((d) => new Date(d.createdAt) >= todayStart).reduce((s, d) => s + fee(d), 0),
          weekEarnings:    data.filter((d) => new Date(d.createdAt) >= weekStart).reduce((s, d) => s + fee(d), 0),
          monthEarnings:   data.filter((d) => new Date(d.createdAt) >= monthStart).reduce((s, d) => s + fee(d), 0),
          pendingPayout:   null,
        });
      } catch { /* ignore */ }
    } finally { setEarningsLoading(false); }
  }, []);

  useEffect(() => { fetchAvailable(); fetchEarnings(); }, []);

  // Poll every 20 s when online
  useEffect(() => {
    if (isOnline) pollRef.current = setInterval(() => fetchAvailable(true), 20_000);
    else          clearInterval(pollRef.current);
    return () => clearInterval(pollRef.current);
  }, [isOnline, fetchAvailable]);

  // Socket: new delivery available
  useEffect(() => {
    const unsub = on("delivery_available", () => {
      fetchAvailable(true);
      addToast("🛵 New delivery available!", "info");
    });
    return () => { if (typeof unsub === "function") unsub(); };
  }, [on, fetchAvailable, addToast]);

  const toggleOnline = useCallback(async () => {
    setTogglingOnline(true);
    try {
      await authAPI.toggleAvailability();
      const next = !isOnline;
      setIsOnline(next);
      addToast(next ? "You're now online! 🟢" : "You're now offline", next ? "success" : "info");
      if (!next) setAvailable([]); else fetchAvailable();
    } catch {
      addToast("Failed to update availability", "error");
    } finally { setTogglingOnline(false); }
  }, [isOnline, addToast, fetchAvailable]);

  const acceptDelivery = useCallback(async (orderId) => {
    setAccepting(orderId);
    try {
      await orderAPI.accept(orderId);
      addToast("Delivery accepted! 🎉 Head to the store.", "success");
      navigate("/delivery/active");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to accept delivery", "error");
    } finally { setAccepting(null); }
  }, [addToast, navigate]);

  const handleRequestPayout = useCallback(async () => {
    try {
      const { data } = await api.post("/delivery/payout/request");
      addToast(data.message || "Payout request submitted!", "success");
      // Refresh earnings to show pending state
      await fetchEarnings();
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to request payout", "error");
      throw err;  // re-throw so EarningsWallet can revert button state
    }
  }, [addToast, fetchEarnings]);

  const handleLogout = () => { logout(); clearCart(); navigate("/login"); };

  const vehicleEmoji = { bike:"🏍️", scooter:"🛵", cycle:"🚲" }[user?.vehicleType] || "🛵";

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
          <button
            onClick={() => { fetchAvailable(true); fetchEarnings(); }}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* ── NEW: Earnings Wallet ── */}
        {earningsLoading ? (
          <div
            className="rounded-2xl p-5 mb-4 flex items-center gap-3"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Loader2 size={18} className="animate-spin" style={{ color: "var(--brand)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading wallet…</p>
          </div>
        ) : (
          <EarningsWallet earnings={earnings} onRequestPayout={handleRequestPayout} />
        )}

        {/* Online toggle */}
        <div
          className="rounded-2xl p-5 mb-4 transition-all"
          style={{
            background: isOnline
              ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))"
              : "var(--card)",
            border: `1.5px solid ${isOnline ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: isOnline ? "rgba(34,197,94,0.15)" : "var(--elevated)" }}
            >
              {vehicleEmoji}
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                {isOnline ? "🟢 You're Online" : "🔴 You're Offline"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {isOnline
                  ? "Receiving food & grocery orders · Auto-refreshing every 20s"
                  : "Toggle on to start receiving orders"}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              disabled={togglingOnline}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{
                background: isOnline ? "rgba(34,197,94,0.15)" : "var(--elevated)",
                color:      isOnline ? "#22c55e"               : "var(--text-muted)",
                border: `1px solid ${isOnline ? "rgba(34,197,94,0.25)" : "var(--border)"}`,
              }}
            >
              {togglingOnline
                ? <Loader2 size={16} className="animate-spin" />
                : isOnline ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {isOnline ? "Online" : "Go Online"}
            </button>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link
            to="/delivery/active"
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.15)" }}>
              <Navigation size={16} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--brand)" }}>Active Delivery</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current order</p>
            </div>
          </Link>
          <Link
            to="/delivery/history"
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.12)" }}>
              <Package size={16} style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>History</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {earnings?.totalDeliveries || 0} total
              </p>
            </div>
          </Link>
        </div>

        {/* Available orders */}
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
              <button onClick={toggleOnline} className="btn btn-brand text-sm">Go Online</button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
            </div>
          ) : available.length === 0 ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-5xl mb-3" style={{ animation: "float 3s ease-in-out infinite" }}>🔍</div>
              <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>No orders right now</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                New orders from food &amp; grocery stores appear here automatically
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Auto-refreshing every 20 seconds</p>
            </div>
          ) : (
            <div className="space-y-4">
              {available.map((order) => (
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
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm mt-6 transition-all hover:scale-[1.01]"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.18)" }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}