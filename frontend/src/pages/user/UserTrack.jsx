import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, MapPin, Phone, Clock, CheckCircle, Package,
  Truck, RefreshCw, Star, MessageCircle, Zap,
  ShoppingBag, XCircle, User, Store
} from "lucide-react";
import api from "../../api/api";

// ─── Step config ─────────────────────────────────────────────
const STATUS_STEPS = [
  { key: "pending",           label: "Order Placed",      sub: "We received your order",          icon: ShoppingBag, color: "#f59e0b" },
  { key: "confirmed",         label: "Confirmed",         sub: "Store accepted your order",        icon: CheckCircle, color: "#3b82f6" },
  { key: "preparing",         label: "Preparing",         sub: "Your items are being packed",      icon: Package,     color: "#8b5cf6" },
  { key: "ready_for_pickup",  label: "Ready for Pickup",  sub: "Looking for a delivery partner",   icon: Zap,         color: "#f97316" },
  { key: "out_for_delivery",  label: "Out for Delivery",  sub: "Rider is on the way to you",       icon: Truck,       color: "#ff6b35" },
  { key: "delivered",         label: "Delivered",         sub: "Enjoy your order! 🎉",             icon: CheckCircle, color: "#22c55e" },
];

const STATUS_INDEX = {
  pending: 0, confirmed: 1, preparing: 2,
  ready_for_pickup: 3, out_for_delivery: 4, delivered: 5, cancelled: -1,
};

const DEMO_ORDER = {
  _id: "demo123",
  status: "preparing",
  createdAt: new Date().toISOString(),
  estimatedTime: "20–30 min",
  paymentMethod: "cod",
  deliveryAddress: "123, 4th Main, HSR Layout, Bengaluru – 560102",
  totalPrice: 245,
  deliveryFee: 20,
  notes: "Please ring the bell twice",
  storeId: {
    name: "FreshMart Express",
    phone: "+91 98765 43210",
    address: "Koramangala 5th Block, Bengaluru",
    category: "Groceries",
  },
  deliveryAgentId: null,
  items: [
    { name: "Amul Full Cream Milk", price: 28,  quantity: 2, image: "" },
    { name: "Brown Bread Loaf",     price: 45,  quantity: 1, image: "" },
    { name: "Tata Salt 1kg",        price: 22,  quantity: 1, image: "" },
    { name: "Fortune Refined Oil",  price: 145, quantity: 1, image: "" },
  ],
};

function PulsingDot({ color = "var(--brand)" }) {
  return (
    <span className="relative inline-flex h-3 w-3 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: color }} />
    </span>
  );
}

export default function UserTrack() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => { fetchOrder(); }, [id]);

  useEffect(() => {
    if (!order || ["delivered", "cancelled"].includes(order.status)) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => fetchOrder(true), 15000);
    return () => clearInterval(intervalRef.current);
  }, [order?.status]);

  const fetchOrder = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch {
      setOrder({ ...DEMO_ORDER, _id: id });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
            <div className="absolute inset-2.5 rounded-full border-2 animate-spin"
              style={{ borderColor: "transparent", borderBottomColor: "#f59e0b", animationDirection: "reverse", animationDuration: "0.7s" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const stepIdx      = STATUS_INDEX[order.status] ?? 0;
  const isCancelled  = order.status === "cancelled";
  const isDelivered  = order.status === "delivered";
  const isActive     = !isCancelled && !isDelivered;
  const currentStep  = STATUS_STEPS[stepIdx];
  const orderTotal   = (order.totalPrice || 0) + (order.deliveryFee || 0);

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* ✅ Fixed: navigate to /user/orders instead of broken path */}
            <button onClick={() => navigate("/user/orders")}
              className="p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>Track Order</h1>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                #{(order._id || "").slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={() => fetchOrder(true)} disabled={refreshing}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Live status banner */}
        {isActive && currentStep && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.04))", border: "1.5px solid rgba(255,107,53,0.22)" }}>
            <PulsingDot color={currentStep.color} />
            <div className="flex-1">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>{currentStep.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {currentStep.sub} · Est. {order.estimatedTime || "20–30 min"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: "var(--brand)" }}>LIVE</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Auto-refresh</p>
            </div>
          </div>
        )}

        {/* Delivered banner */}
        {isDelivered && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-4"
            style={{ background: "rgba(34,197,94,0.08)", border: "1.5px solid rgba(34,197,94,0.25)" }}>
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: "#22c55e" }}>Order Delivered!</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Hope you enjoy your order!
              </p>
            </div>
            {!showRating && (
              <button onClick={() => setShowRating(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all hover:scale-105"
                style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                <Star size={12} /> Rate
              </button>
            )}
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)" }}>
            <XCircle size={20} style={{ color: "#ef4444" }} />
            <div>
              <p className="font-bold" style={{ color: "#ef4444" }}>Order Cancelled</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Refund processed in 3–5 business days</p>
            </div>
          </div>
        )}

        {/* Rating panel */}
        {showRating && (
          <div className="rounded-3xl p-5 mb-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="font-bold text-center mb-1" style={{ color: "var(--text-primary)" }}>How was your order?</p>
            <p className="text-xs text-center mb-4" style={{ color: "var(--text-muted)" }}>Rate your experience with {order.storeId?.name}</p>
            <div className="flex justify-center gap-3 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl transition-transform hover:scale-125 active:scale-110">
                  {s <= (hoverRating || rating) ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRating(false)}
                className="btn btn-ghost flex-1 justify-center text-sm py-2.5">Skip</button>
              <button onClick={() => setShowRating(false)} disabled={!rating}
                className="btn btn-brand flex-1 justify-center text-sm py-2.5">
                Submit Rating
              </button>
            </div>
          </div>
        )}

        {/* Progress timeline */}
        {!isCancelled && (
          <div className="rounded-3xl p-5 mb-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest mb-5"
              style={{ color: "var(--text-muted)" }}>Order Progress</h2>
            <div className="space-y-1">
              {STATUS_STEPS.map((step, i) => {
                const isDone    = i <= stepIdx;
                const isActivStep = i === stepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className="flex flex-col items-center" style={{ width: 36, flexShrink: 0 }}>
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500"
                        style={{
                          background: isDone
                            ? isActivStep ? step.color : "rgba(34,197,94,0.1)"
                            : "var(--elevated)",
                          border: `2px solid ${isDone ? isActivStep ? step.color : "rgba(34,197,94,0.3)" : "var(--border)"}`,
                          boxShadow: isActivStep ? `0 0 18px ${step.color}45` : "none",
                          transform: isActivStep ? "scale(1.1)" : "scale(1)",
                        }}>
                        <Icon size={14} style={{ color: isDone ? isActivStep ? "white" : "#22c55e" : "var(--text-muted)" }} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="w-0.5 h-8 mt-1 rounded-full transition-all duration-700"
                          style={{ background: i < stepIdx ? "rgba(34,197,94,0.35)" : "var(--border)" }} />
                      )}
                    </div>
                    <div className="pt-2 pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm"
                          style={{ color: isDone ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {step.label}
                        </p>
                        {isActivStep && (
                          <span className="tag text-[10px] py-0.5 px-2"
                            style={{ background: step.color + "20", color: step.color }}>
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery agent */}
        {order.deliveryAgentId && (
          <div className="rounded-3xl p-5 mb-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--text-muted)" }}>Delivery Partner</h2>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                🛵
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {order.deliveryAgentId?.name || "Delivery Partner"}
                </p>
                <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  <Star size={10} fill="#f59e0b" stroke="none" />
                  <span style={{ color: "#f59e0b" }}>{order.deliveryAgentId?.rating || "4.8"}</span>
                  <span>· {order.deliveryAgentId?.vehicleType || "bike"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {order.deliveryAgentId?.phone && (
                  <a href={`tel:${order.deliveryAgentId.phone}`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                    <Phone size={16} />
                  </a>
                )}
                <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Store info */}
        <div className="rounded-3xl p-5 mb-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}>Store</h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--elevated)" }}>🏪</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>{order.storeId?.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{order.storeId?.address}</p>
            </div>
            {order.storeId?.phone && (
              <a href={`tel:${order.storeId.phone}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)" }}>
                <Phone size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Order items */}
        <div className="rounded-3xl overflow-hidden mb-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Items ({order.items?.length || 0})
            </h2>
          </div>
          {(order.items || []).map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 img-fallback text-sm"
                style={{ background: "var(--elevated)" }}>
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <span>🛍️</span>}
              </div>
              <p className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>{item.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-md mr-2"
                style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                ×{item.quantity || 1}
              </span>
              <p className="text-sm font-bold w-16 text-right" style={{ color: "var(--text-primary)" }}>
                ₹{(item.price || 0) * (item.quantity || 1)}
              </p>
            </div>
          ))}
          <div className="px-5 py-4 flex justify-between font-bold"
            style={{ borderTop: "1px solid var(--border)", background: "var(--elevated)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Total Paid</span>
            <span style={{ color: "var(--brand)", fontSize: "1.1rem" }}>₹{orderTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="rounded-3xl p-5 mb-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}>Delivery Address</h2>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.1)" }}>
              <MapPin size={15} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {order.deliveryAddress}
              </p>
              {order.notes && (
                <p className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block"
                  style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                  📝 {order.notes}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {order.paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Online Payment"}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        {isDelivered ? (
          <Link to="/user/home" className="btn btn-brand w-full justify-center py-4 text-base">
            Order Again 🔄
          </Link>
        ) : isCancelled ? (
          <Link to="/user/home" className="btn btn-brand w-full justify-center py-4 text-base">
            Browse Stores
          </Link>
        ) : (
          <button onClick={() => fetchOrder(true)}
            className="btn btn-ghost w-full justify-center py-3.5 text-sm">
            <RefreshCw size={15} /> Refresh Status
          </button>
        )}
      </div>
    </div>
  );
}