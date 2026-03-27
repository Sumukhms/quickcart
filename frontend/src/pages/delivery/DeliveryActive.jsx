import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Phone, MapPin, CheckCircle, Package,
  Truck, Navigation, Store, User, Check, RefreshCw,
  MessageCircle, AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

const DEMO_ACTIVE = {
  _id: "active1",
  status: "out_for_delivery",
  totalPrice: 245,
  deliveryFee: 30,
  deliveryAddress: "12, 3rd Main Road, HSR Layout, Bengaluru – 560102",
  storeId: { name: "FreshMart Express", address: "Koramangala 5th Block", phone: "+91 98765 43210" },
  userId:  { name: "Raj Kumar",         address: "HSR Layout",             phone: "+91 87654 32109" },
  items: [
    { name: "Amul Full Cream Milk", quantity: 2, price: 28 },
    { name: "Brown Bread Loaf",     quantity: 1, price: 45 },
    { name: "Fortune Oil 1L",       quantity: 1, price: 145 },
  ],
  createdAt: new Date().toISOString(),
};

function StepBadge({ step, currentStep }) {
  const steps = ["Picked Up", "On the Way", "Delivered"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: i <= currentStep ? "rgba(255,107,53,0.12)" : "var(--elevated)",
              color: i <= currentStep ? "var(--brand)" : "var(--text-muted)",
              border: `1px solid ${i <= currentStep ? "rgba(255,107,53,0.25)" : "var(--border)"}`,
            }}>
            {i < currentStep ? <Check size={11} /> : null}
            {s}
          </div>
          {i < steps.length - 1 && (
            <div className="w-4 h-0.5 rounded-full" style={{ background: i < currentStep ? "var(--brand)" : "var(--border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DeliveryActive() {
  const { user } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();

  const [order,      setOrder]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [markingDone,setMarkingDone]= useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pickedUp,   setPickedUp]   = useState(false);

  useEffect(() => { fetchActive(); }, []);

  const fetchActive = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await api.get("/orders/delivery/mine", { params: { status: "out_for_delivery" } });
      setOrder(data[0] || null);
    } catch {
      setOrder(DEMO_ACTIVE);
    } finally { setLoading(false); setRefreshing(false); }
  };

  const markDelivered = async () => {
    if (!order) return;
    setMarkingDone(true);
    try {
      await api.post(`/orders/${order._id}/delivered`);
    } catch {}
    addToast("Order delivered! 🎉 Great job!", "success");
    navigate("/delivery/history");
  };

  const currentStep = pickedUp ? 1 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/delivery/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>Active Delivery</h1>
            {order && (
              <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                #{(order._id || "").slice(-8).toUpperCase()}
              </p>
            )}
          </div>
          <button onClick={() => fetchActive(true)} className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {!order ? (
          <div className="text-center py-20 rounded-3xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-6xl mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>🛵</div>
            <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>No Active Delivery</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Accept an order from your dashboard to start delivering
            </p>
            <Link to="/delivery/dashboard" className="btn btn-brand text-sm">
              Find Orders
            </Link>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="rounded-2xl p-4 mb-4 overflow-x-auto"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <StepBadge step={currentStep} currentStep={currentStep} />
            </div>

            {/* Earnings Banner */}
            <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
              style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.05))", border: "1.5px solid rgba(255,107,53,0.2)" }}>
              <div className="text-3xl">💰</div>
              <div>
                <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                  ₹{order.deliveryFee || 30} earnings on delivery
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Order value: ₹{order.totalPrice}</p>
              </div>
            </div>

            {/* Route Card */}
            <div className="rounded-3xl overflow-hidden mb-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>

              {/* Pickup */}
              <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)" }}>
                    <Store size={15} style={{ color: "#22c55e" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Pickup from</span>
                      {pickedUp && <Check size={12} style={{ color: "#22c55e" }} />}
                    </div>
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      {order.storeId?.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {order.storeId?.address}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {order.storeId?.phone && (
                      <a href={`tel:${order.storeId.phone}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
                        <Phone size={14} />
                      </a>
                    )}
                    <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "var(--elevated)", color: "var(--brand)" }}>
                      <Navigation size={14} />
                    </button>
                  </div>
                </div>
                {!pickedUp && (
                  <button onClick={() => setPickedUp(true)}
                    className="btn w-full justify-center py-2.5 text-sm mt-3 transition-all"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <Check size={14} /> Mark as Picked Up
                  </button>
                )}
              </div>

              {/* Delivery */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,107,53,0.1)" }}>
                    <User size={15} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider mb-0.5 block" style={{ color: "var(--text-muted)" }}>Deliver to</span>
                    <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                      {order.userId?.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {order.deliveryAddress}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {order.userId?.phone && (
                      <a href={`tel:${order.userId.phone}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)" }}>
                        <Phone size={14} />
                      </a>
                    )}
                    <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "var(--elevated)", color: "var(--brand)" }}>
                      <Navigation size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div className="rounded-3xl overflow-hidden mb-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  Items to Deliver
                </p>
              </div>
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: "var(--elevated)" }}>🛍️</div>
                  <p className="flex-1 text-sm" style={{ color: "var(--text-secondary)" }}>{item.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded-md"
                    style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                    ×{item.quantity || 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Mark Delivered */}
            {pickedUp && (
              <button onClick={markDelivered} disabled={markingDone}
                className="btn btn-brand w-full justify-center py-4 text-base"
                style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.35)" }}>
                {markingDone
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><CheckCircle size={18} /> Mark as Delivered</>}
              </button>
            )}

            {!pickedUp && (
              <div className="flex items-center gap-2 text-xs px-4 py-3 rounded-xl"
                style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                <AlertCircle size={14} />
                Go to the store, pick up the order, then mark it as picked up
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}