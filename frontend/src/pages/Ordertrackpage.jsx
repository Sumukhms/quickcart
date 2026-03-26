import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Clock, CheckCircle, Package, Truck, RefreshCw, Star, MessageCircle } from "lucide-react";
import api from "../api/api";

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", sub: "We received your order", icon: Package },
  { key: "confirmed", label: "Confirmed", sub: "Store accepted your order", icon: CheckCircle },
  { key: "preparing", label: "Preparing", sub: "Your order is being prepared", icon: Package },
  { key: "out_for_delivery", label: "Out for Delivery", sub: "Rider is on the way", icon: Truck },
  { key: "delivered", label: "Delivered", sub: "Enjoy your order!", icon: CheckCircle },
];

const STATUS_INDEX = { pending: 0, confirmed: 1, preparing: 2, out_for_delivery: 3, delivered: 4, cancelled: -1 };

const DEMO_ORDER = {
  _id: "demo123",
  status: "preparing",
  createdAt: new Date().toISOString(),
  estimatedTime: "20–30 min",
  paymentMethod: "cod",
  deliveryAddress: "123, 4th Main, HSR Layout, Bengaluru",
  totalPrice: 245,
  deliveryFee: 20,
  storeId: { name: "FreshMart Express", phone: "+91 98765 43210", address: "Koramangala" },
  items: [
    { name: "Amul Full Cream Milk", price: 28, quantity: 2, image: "" },
    { name: "Brown Bread Loaf", price: 45, quantity: 1, image: "" },
    { name: "Tata Salt 1kg", price: 22, quantity: 1, image: "" },
    { name: "Fortune Refined Oil", price: 145, quantity: 1, image: "" },
  ],
};

export default function OrderTrackPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchOrder(); }, [id]);

  // Poll for updates every 15s when order is active
  useEffect(() => {
    if (!order || ["delivered", "cancelled"].includes(order.status)) return;
    const interval = setInterval(() => fetchOrder(true), 15000);
    return () => clearInterval(interval);
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const stepIdx = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  const orderTotal = (order.totalPrice || 0) + (order.deliveryFee || 0);

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/orders" className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>Track Order</h1>
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
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
        {!isCancelled && !isDelivered && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)" }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--brand)", animation: "pulseDot 1.5s infinite" }} />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                {STATUS_STEPS[stepIdx]?.label}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Estimated: {order.estimatedTime || "20–30 min"}
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--brand)" }}>
              <Clock size={12} /> Live
            </div>
          </div>
        )}

        {isDelivered && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <CheckCircle size={20} style={{ color: "#22c55e" }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#22c55e" }}>Order Delivered!</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Hope you enjoy your order</p>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
              <Star size={11} /> Rate
            </button>
          </div>
        )}

        {isCancelled && (
          <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <div className="text-xl">❌</div>
            <div>
              <p className="font-bold text-sm" style={{ color: "#ef4444" }}>Order Cancelled</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Refund will be processed in 3–5 days</p>
            </div>
          </div>
        )}

        {/* Progress timeline */}
        {!isCancelled && (
          <div className="rounded-3xl p-5 mb-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="font-bold text-sm uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Order Progress</h2>
            <div className="space-y-1">
              {STATUS_STEPS.map((step, i) => {
                const isDone = i <= stepIdx;
                const isActive = i === stepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    {/* Line + dot */}
                    <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500"
                        style={{
                          background: isDone ? (isActive ? "var(--brand)" : "rgba(34,197,94,0.12)") : "var(--elevated)",
                          border: `2px solid ${isDone ? (isActive ? "var(--brand)" : "rgba(34,197,94,0.4)") : "var(--border)"}`,
                          boxShadow: isActive ? "0 0 16px rgba(255,107,53,0.4)" : "none",
                        }}>
                        <Icon size={14} style={{ color: isDone ? (isActive ? "white" : "#22c55e") : "var(--text-muted)" }} />
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className="w-0.5 h-6 mt-1 rounded-full transition-all duration-500"
                          style={{ background: i < stepIdx ? "rgba(34,197,94,0.4)" : "var(--border)" }} />
                      )}
                    </div>
                    {/* Text */}
                    <div className="pt-1.5 pb-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm transition-colors"
                          style={{ color: isDone ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {step.label}
                        </p>
                        {isActive && (
                          <span className="tag tag-brand text-[10px] py-0.5 px-2">Now</span>
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

        {/* Store info */}
        <div className="rounded-3xl p-5 mb-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Store</h2>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: "var(--elevated)" }}>🏪</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>{order.storeId?.name || "Store"}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{order.storeId?.address || ""}</p>
            </div>
            {order.storeId?.phone && (
              <a href={`tel:${order.storeId.phone}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)" }}>
                <Phone size={16} />
              </a>
            )}
            <button className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
              <MessageCircle size={16} />
            </button>
          </div>
        </div>

        {/* Order items */}
        <div className="rounded-3xl overflow-hidden mb-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Order Items
            </h2>
          </div>
          <div className="divide-y">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5"
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 img-fallback text-sm"
                  style={{ background: "var(--elevated)" }}>
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : "🛍️"}
                </div>
                <p className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>{item.name}</p>
                <span className="text-xs px-1.5 py-0.5 rounded-md mr-2" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                  ×{item.quantity || 1}
                </span>
                <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                  ₹{(item.price || 0) * (item.quantity || 1)}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 flex justify-between font-bold"
            style={{ borderTop: "1px solid var(--border)", background: "var(--elevated)" }}>
            <span style={{ color: "var(--text-secondary)" }}>Total Paid</span>
            <span style={{ color: "var(--brand)" }}>₹{orderTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="rounded-3xl p-5 mb-4"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Delivery To</h2>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.1)" }}>
              <MapPin size={15} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{order.deliveryAddress}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
              </p>
            </div>
          </div>
        </div>

        {/* Re-order button for delivered */}
        {isDelivered && (
          <Link to="/" className="btn btn-brand w-full justify-center py-3.5 text-base">
            Order Again 🔄
          </Link>
        )}
      </div>
    </div>
  );
}