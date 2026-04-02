import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Phone,
  CheckCircle,
  Package,
  Truck,
  Navigation,
  Store,
  User,
  Check,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { orderAPI } from "../../api/api";
import GpsTracker from "../../components/tracking/GpsTracker";

const STEPS = [
  {
    key: "pickup",
    label: "Pick Up",
    sub: "Go to store & collect order",
    icon: Store,
    color: "#22c55e",
  },
  {
    key: "transit",
    label: "On the Way",
    sub: "Riding to customer's address",
    icon: Truck,
    color: "var(--brand)",
  },
  {
    key: "done",
    label: "Delivered",
    sub: "Hand over to customer",
    icon: CheckCircle,
    color: "#22c55e",
  },
];

export default function DeliveryActive() {
  const { user } = useAuth();
  const { addToast } = useCart();
  const { emit } = useSocket();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const fetchActive = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const { data } = await orderAPI.getMyDeliveries({
          status: "out_for_delivery",
        });
        setOrder(data[0] || null);
      } catch (err) {
        if (!silent)
          addToast(
            err.response?.data?.message || "Failed to load active delivery",
            "error",
          );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const markPickedUp = () => {
    setCurrentStep(1);
    addToast("Order picked up! 📦 Head to customer.", "success");
    // Emit location update
    if (order)
      emit("update_location", {
        orderId: order._id,
        lat: 12.9716,
        lng: 77.5946,
      });
  };

  const markDelivered = useCallback(async () => {
    if (!order) return;
    setMarkingDone(true);
    try {
      // Use unified status endpoint — backend validates delivery role
      await orderAPI.updateStatus(order._id, "delivered");
      addToast("Order delivered! 🎉 Great job!", "success");
      navigate("/delivery/history");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to mark as delivered",
        "error",
      );
    } finally {
      setMarkingDone(false);
    }
  }, [order, addToast, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin"
            style={{ color: "var(--brand)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading delivery...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen page-enter"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/delivery/dashboard"
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1
              className="font-display font-bold text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              Active Delivery
            </h1>
            {order && (
              <p
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                #{order._id?.slice(-8).toUpperCase()}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchActive(true)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {!order ? (
          <div
            className="text-center py-20 rounded-3xl"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="text-6xl mb-4"
              style={{ animation: "float 3s ease-in-out infinite" }}
            >
              🛵
            </div>
            <h2
              className="font-bold text-xl mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              No Active Delivery
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Accept an order from the dashboard to start delivering.
            </p>
            <Link to="/delivery/dashboard" className="btn btn-brand text-sm">
              Find Orders
            </Link>
          </div>
        ) : (
          <>
            {/* Earnings banner */}
            <div
              className="rounded-2xl p-4 mb-4 flex items-center gap-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.04))",
                border: "1.5px solid rgba(255,107,53,0.2)",
              }}
            >
              <div className="text-2xl">💰</div>
              <div className="flex-1">
                <p
                  className="font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  ₹{order.deliveryFee || 30} earnings
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Order: ₹{order.totalPrice} ·{" "}
                  {order.paymentMethod === "cod"
                    ? "💵 Collect cash"
                    : "💳 Online paid"}
                </p>
              </div>
            </div>

            {/* Step tracker */}
            <div
              className="rounded-2xl p-4 mb-4"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                Progress
              </p>
              <div className="flex items-center gap-0">
                {STEPS.map((step, i) => {
                  const isDone = i < currentStep;
                  const isActive = i === currentStep;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500"
                          style={{
                            background:
                              isDone || isActive
                                ? step.color + "15"
                                : "var(--elevated)",
                            border: `2px solid ${isDone ? step.color : isActive ? step.color : "var(--border)"}`,
                            boxShadow: isActive
                              ? `0 0 16px ${step.color}40`
                              : "none",
                            transform: isActive ? "scale(1.1)" : "scale(1)",
                          }}
                        >
                          {isDone ? (
                            <Check size={15} style={{ color: step.color }} />
                          ) : (
                            <Icon
                              size={14}
                              style={{
                                color: isActive
                                  ? step.color
                                  : "var(--text-muted)",
                              }}
                            />
                          )}
                        </div>
                        <p
                          className="text-[10px] font-semibold text-center"
                          style={{
                            color:
                              isDone || isActive
                                ? "var(--text-primary)"
                                : "var(--text-muted)",
                          }}
                        >
                          {step.label}
                        </p>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className="h-0.5 flex-shrink-0 mx-1 rounded-full transition-all duration-500"
                          style={{
                            width: 24,
                            background:
                              i < currentStep ? "#22c55e" : "var(--border)",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pickup card */}
            <div
              className="rounded-3xl overflow-hidden mb-4"
              style={{
                backgroundColor: "var(--card)",
                border: `1.5px solid ${currentStep === 0 ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
              }}
            >
              {/* Store */}
              <div
                className="p-5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)" }}
                  >
                    <Store size={16} style={{ color: "#22c55e" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Pickup from
                      </p>
                      {currentStep > 0 && (
                        <span className="tag tag-green text-[10px]">
                          <Check size={9} /> Picked up
                        </span>
                      )}
                    </div>
                    <p
                      className="font-bold text-sm mt-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {order.storeId?.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {order.storeId?.address}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {order.storeId?.phone && (
                      <a
                        href={`tel:${order.storeId.phone}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: "rgba(34,197,94,0.1)",
                          color: "#22c55e",
                        }}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    <button
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: "var(--elevated)",
                        color: "var(--brand)",
                      }}
                    >
                      <Navigation size={14} />
                    </button>
                  </div>
                </div>

                {/* Items */}
                <div
                  className="rounded-xl p-3 mb-3"
                  style={{ background: "var(--elevated)" }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Items to collect
                  </p>
                  {order.items?.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm py-0.5"
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        • {item.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        ×{item.quantity || 1}
                      </span>
                    </div>
                  ))}
                </div>

                {currentStep === 0 && (
                  <button
                    onClick={markPickedUp}
                    className="btn w-full justify-center py-3 text-sm font-bold transition-all"
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      color: "#22c55e",
                      border: "1.5px solid rgba(34,197,94,0.3)",
                    }}
                  >
                    <Check size={15} /> Confirm Pickup — Items Collected
                  </button>
                )}
              </div>

              {/* Customer */}
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(255,107,53,0.1)" }}
                  >
                    <User size={16} style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Deliver to
                    </p>
                    <p
                      className="font-bold text-sm mt-0.5"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {order.userId?.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {order.deliveryAddress}
                    </p>
                    {order.paymentMethod === "cod" && (
                      <div
                        className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold"
                        style={{ color: "#f59e0b" }}
                      >
                        <DollarSign size={11} /> Collect ₹{order.totalPrice}{" "}
                        cash
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {order.userId?.phone && (
                      <a
                        href={`tel:${order.userId.phone}`}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                        style={{
                          background: "rgba(255,107,53,0.1)",
                          color: "var(--brand)",
                        }}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    <button
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: "var(--elevated)",
                        color: "var(--brand)",
                      }}
                    >
                      <Navigation size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {currentStep === 0 && (
              <div
                className="flex items-center gap-2 text-xs px-4 py-3 rounded-xl mb-4"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <AlertCircle size={14} />
                Go to the store, collect all items, then tap "Confirm Pickup"
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-3">
                <GpsTracker orderId={order._id} isDelivering={true} />
                <button
                  onClick={markDelivered}
                  disabled={markingDone}
                  className="btn btn-brand w-full justify-center py-4 text-base font-bold"
                  style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.35)" }}
                >
                  {markingDone ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Marking
                      delivered...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} /> Mark as Delivered
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
