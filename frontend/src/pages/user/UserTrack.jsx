/**
 * UserTrack.jsx — FIXED v3
 *
 * What changed vs v2:
 *   1. Delivery partner rating panel added (separate from store rating)
 *      POST /api/ratings/delivery  { orderId, rating }
 *   2. userCoords now populated from the order's structured delivery address
 *      lat/lng (stored when CheckoutPage picks a structured Address).
 *      Falls back gracefully when coords are unavailable.
 *   3. Order total computation unchanged (correct since v2)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Phone,
  CheckCircle,
  Package,
  Truck,
  RefreshCw,
  Star,
  Zap,
  ShoppingBag,
  XCircle,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Ban,
  Download,
} from "lucide-react";
import { orderAPI } from "../../api/api";
import api from "../../api/api";
import { useSocket } from "../../context/SocketContext";
import { useCart } from "../../context/CartContext";
import {
  getTimelineSteps,
  getStatusMessage,
  getStatusIndex,
  STATUS_VISUAL,
} from "../../utils/orderFlows";
import OrderSummary from "../../components/order/OrderSummary";
import DeliveryNearBanner from "../../components/delivery/DeliveryNearBanner";
import { useInvoiceDownload } from "../../hooks/useInvoiceDownload";

const STATUS_ICONS = {
  pending: ShoppingBag,
  confirmed: CheckCircle,
  preparing: Package,
  packing: ShoppingCart,
  ready_for_pickup: Zap,
  out_for_delivery: Truck,
  delivered: CheckCircle,
};

const CANCELLABLE = ["pending", "confirmed"];

function PulsingDot({ color }) {
  return (
    <span className="relative inline-flex h-3 w-3 flex-shrink-0">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex rounded-full h-3 w-3"
        style={{ background: color }}
      />
    </span>
  );
}

/** Star picker used for both store and delivery rating panels */
function StarPicker({ value, hovered, onHover, onLeave, onChange }) {
  return (
    <div className="flex justify-center gap-3 mb-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => onHover(s)}
          onMouseLeave={onLeave}
          className="text-3xl transition-transform hover:scale-125"
        >
          {s <= (hovered || value) ? "⭐" : "☆"}
        </button>
      ))}
    </div>
  );
}

export default function UserTrack() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { joinOrderRoom, on } = useSocket();
  const { addToast } = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // ── Store rating state ────────────────────────────────────
  const [storeRating, setStoreRating] = useState(0);
  const [storeHover, setStoreHover] = useState(0);
  const [showStoreRating, setShowStoreRating] = useState(false);
  const [storeRatingDone, setStoreRatingDone] = useState(false);
  const [submittingStore, setSubmittingStore] = useState(false);

  // ── Delivery partner rating state (NEW) ──────────────────
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryHover, setDeliveryHover] = useState(0);
  const [showDeliveryRating, setShowDeliveryRating] = useState(false);
  const [deliveryRatingDone, setDeliveryRatingDone] = useState(false);
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // ── Location state ────────────────────────────────────────
  const [deliveryCoords, setDeliveryCoords] = useState({
    lat: null,
    lng: null,
  });
  // FIX: userCoords now extracted from the order's address lat/lng
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });

  const intervalRef = useRef(null);

  // ── Invoice download hook ──────────────────────────────────
  const { download: downloadInvoice, downloading: invoiceLoading } =
    useInvoiceDownload();

  const fetchOrder = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);
      try {
        const { data } = await orderAPI.getById(id);
        setOrder(data);

        // Delivery agent's last known location
        if (data.deliveryLocation?.lat != null) {
          setDeliveryCoords({
            lat: data.deliveryLocation.lat,
            lng: data.deliveryLocation.lng,
          });
        }

        // FIX: customer coords — try to pull from the order's structured address metadata.
        // The structured Address model stores lat/lng; if the order was placed with one
        // we embed them into the order. If not available, leave null (banner hides itself).
        if (data.deliveryLat != null && data.deliveryLng != null) {
          setUserCoords({ lat: data.deliveryLat, lng: data.deliveryLng });
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Could not load order details.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (id) joinOrderRoom(id);

    const unsubStatus = on("order_status_update", ({ orderId, status }) => {
      if (orderId === id || orderId?.toString() === id) {
        setOrder((prev) => (prev ? { ...prev, status } : prev));
        if (status === "delivered") {
          setShowStoreRating(true);
          setShowDeliveryRating(true);
        }
      }
    });

    const unsubLocation = on("location_update", ({ orderId, lat, lng }) => {
      if (orderId === id || orderId?.toString() === id) {
        setDeliveryCoords({ lat, lng });
      }
    });

    return () => {
      if (typeof unsubStatus === "function") unsubStatus();
      if (typeof unsubLocation === "function") unsubLocation();
    };
  }, [id, joinOrderRoom, on]);

  useEffect(() => {
    if (!order || ["delivered", "cancelled"].includes(order.status)) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => fetchOrder(true), 20_000);
    return () => clearInterval(intervalRef.current);
  }, [order?.status, fetchOrder]);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await orderAPI.cancel(order._id);
      setOrder((prev) => ({
        ...prev,
        status: "cancelled",
        statusHistory: [
          ...(prev.statusHistory || []),
          { status: "cancelled", timestamp: new Date().toISOString() },
        ],
      }));
      addToast("Order cancelled successfully", "info");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to cancel order",
        "error",
      );
    } finally {
      setCancelling(false);
    }
  }, [order, addToast]);

  // ── Store rating submit ───────────────────────────────────
  const handleStoreRating = useCallback(async () => {
    if (!storeRating || !order?.storeId?._id) return;
    setSubmittingStore(true);
    try {
      await api.post("/ratings/rate", {
        storeId: order.storeId._id,
        rating: storeRating,
        orderId: order._id,
      });
      setStoreRatingDone(true);
      setShowStoreRating(false);
      addToast(`Thanks for rating ${order.storeId?.name}! ⭐`, "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to submit rating.",
        "error",
      );
    } finally {
      setSubmittingStore(false);
    }
  }, [storeRating, order, addToast]);

  // ── Delivery partner rating submit (NEW) ─────────────────
  const handleDeliveryRating = useCallback(async () => {
    if (!deliveryRating || !order?._id) return;
    setSubmittingDelivery(true);
    try {
      await api.post("/ratings/delivery", {
        orderId: order._id,
        rating: deliveryRating,
      });
      setDeliveryRatingDone(true);
      setShowDeliveryRating(false);
      addToast("Thanks for rating your delivery partner! 🛵", "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to submit rating.",
        "error",
      );
    } finally {
      setSubmittingDelivery(false);
    }
  }, [deliveryRating, order, addToast]);

  // ── Render guards ─────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--brand)",
              }}
            />
            <div
              className="absolute inset-2.5 rounded-full border-2 animate-spin"
              style={{
                borderColor: "transparent",
                borderBottomColor: "#f59e0b",
                animationDirection: "reverse",
                animationDuration: "0.7s",
              }}
            />
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="text-center">
          <AlertCircle
            size={48}
            className="mx-auto mb-4"
            style={{ color: "#ef4444" }}
          />
          <h2
            className="font-bold text-xl mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Order not found
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchOrder()}
              className="btn btn-brand text-sm"
            >
              Retry
            </button>
            <Link to="/user/orders" className="btn btn-ghost text-sm">
              My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const storeCategory = order.storeId?.category || "Other";
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const isActive = !isCancelled && !isDelivered;
  const canCancel = CANCELLABLE.includes(order.status);
  const hasAgent = !!order.deliveryAgentId;

  const deliveryFee = order.deliveryFee ?? 20;
  const itemsSubtotal = (order.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );
  const inferredDiscount = Math.max(
    0,
    itemsSubtotal + deliveryFee - (order.totalPrice ?? 0),
  );

  const timelineSteps = getTimelineSteps(storeCategory).map((step) => ({
    ...step,
    icon: STATUS_ICONS[step.key] || Package,
    color: STATUS_VISUAL[step.key]?.color || "var(--brand)",
  }));
  const stepIdx = getStatusIndex(order.status, storeCategory);
  const currentStepData = stepIdx >= 0 ? timelineSteps[stepIdx] : null;

  return (
    <div
      className="min-h-screen page-enter"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/user/orders")}
              className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1
                className="font-display font-bold text-xl"
                style={{ color: "var(--text-primary)" }}
              >
                Track Order
              </h1>
              <p
                className="text-xs font-mono mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                #{(order._id || "").slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchOrder(true)}
            disabled={refreshing}
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

        {/* Proximity banner (now with real userCoords when available) */}
        <DeliveryNearBanner
          deliveryLat={deliveryCoords.lat}
          deliveryLng={deliveryCoords.lng}
          userLat={userCoords.lat}
          userLng={userCoords.lng}
          status={order.status}
        />

        {/* Live status banner */}
        {isActive && currentStepData && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.04))",
              border: "1.5px solid rgba(255,107,53,0.22)",
            }}
          >
            <PulsingDot color={currentStepData.color} />
            <div className="flex-1">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                {currentStepData.label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {currentStepData.sub} · Est.{" "}
                {order.estimatedTime || "20–30 min"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className="text-xs font-bold"
                style={{ color: "var(--brand)" }}
              >
                LIVE
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Auto-refresh
              </p>
            </div>
          </div>
        )}

        {/* Cancel prompt */}
        {canCancel && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-4"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1.5px solid rgba(245,158,11,0.25)",
            }}
          >
            <div>
              <p className="font-semibold text-sm" style={{ color: "#f59e0b" }}>
                Want to cancel?
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                You can cancel while the order is still {order.status}
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl flex-shrink-0 transition-all hover:scale-105"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              {cancelling ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <Ban size={13} /> Cancel Order
                </>
              )}
            </button>
          </div>
        )}

        {/* Delivered banner */}
        {isDelivered && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-4"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1.5px solid rgba(34,197,94,0.25)",
            }}
          >
            <div className="text-3xl">🎉</div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: "#22c55e" }}>
                {getStatusMessage("delivered", storeCategory).label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {getStatusMessage("delivered", storeCategory).sub}
              </p>
            </div>
          </div>
        )}

        {/* Cancelled banner */}
        {isCancelled && (
          <div
            className="rounded-2xl p-4 mb-4 flex items-center gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1.5px solid rgba(239,68,68,0.25)",
            }}
          >
            <XCircle size={20} style={{ color: "#ef4444" }} />
            <div>
              <p className="font-bold" style={{ color: "#ef4444" }}>
                Order Cancelled
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Refund processed in 3–5 business days (if applicable)
              </p>
            </div>
          </div>
        )}

        {/* ── Store rating panel ─────────────────────────────────── */}
        {showStoreRating && !storeRatingDone && (
          <div
            className="rounded-3xl p-5 mb-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="font-bold text-center mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              How was the food from {order.storeId?.name}?
            </p>
            <p
              className="text-xs text-center mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Rate the store (1–5 stars)
            </p>
            <StarPicker
              value={storeRating}
              hovered={storeHover}
              onHover={setStoreHover}
              onLeave={() => setStoreHover(0)}
              onChange={setStoreRating}
            />
            {storeRating > 0 && (
              <p
                className="text-center text-xs mb-3 font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                {
                  ["", "Poor", "Fair", "Good", "Great", "Excellent!"][
                    storeRating
                  ]
                }
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowStoreRating(false);
                  setStoreRatingDone(true);
                }}
                className="btn btn-ghost flex-1 justify-center text-sm py-2.5"
              >
                Skip
              </button>
              <button
                onClick={handleStoreRating}
                disabled={!storeRating || submittingStore}
                className="btn btn-brand flex-1 justify-center text-sm py-2.5"
              >
                {submittingStore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  "Rate Store"
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Delivery partner rating panel (NEW) ───────────────── */}
        {isDelivered &&
          hasAgent &&
          showDeliveryRating &&
          !deliveryRatingDone && (
            <div
              className="rounded-3xl p-5 mb-4"
              style={{
                background: "var(--card)",
                border: "1.5px solid rgba(0,212,170,0.25)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(0,212,170,0.12)" }}
                >
                  🛵
                </div>
                <div>
                  <p
                    className="font-bold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Rate your delivery partner
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {order.deliveryAgentId?.name || "Your rider"} · How was the
                    delivery experience?
                  </p>
                </div>
              </div>
              <StarPicker
                value={deliveryRating}
                hovered={deliveryHover}
                onHover={setDeliveryHover}
                onLeave={() => setDeliveryHover(0)}
                onChange={setDeliveryRating}
              />
              {deliveryRating > 0 && (
                <p
                  className="text-center text-xs mb-3 font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  {
                    [
                      "",
                      "Very slow",
                      "Could be better",
                      "Good",
                      "Fast & friendly",
                      "Excellent service!",
                    ][deliveryRating]
                  }
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeliveryRating(false);
                    setDeliveryRatingDone(true);
                  }}
                  className="btn btn-ghost flex-1 justify-center text-sm py-2.5"
                >
                  Skip
                </button>
                <button
                  onClick={handleDeliveryRating}
                  disabled={!deliveryRating || submittingDelivery}
                  className="btn flex-1 justify-center text-sm py-2.5 font-bold transition-all hover:scale-105"
                  style={{
                    background: "rgba(0,212,170,0.15)",
                    color: "#00d4aa",
                    border: "1px solid rgba(0,212,170,0.3)",
                  }}
                >
                  {submittingDelivery ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    "Rate Rider"
                  )}
                </button>
              </div>
            </div>
          )}

        {/* Rated badges */}
        {isDelivered && (storeRatingDone || deliveryRatingDone) && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {storeRatingDone && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
              >
                ⭐ Store rated
              </span>
            )}
            {deliveryRatingDone && (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ background: "rgba(0,212,170,0.1)", color: "#00d4aa" }}
              >
                🛵 Rider rated
              </span>
            )}
          </div>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div
            className="rounded-3xl p-5 mb-4"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Order Progress
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider"
                style={{
                  background:
                    storeCategory === "Food"
                      ? "rgba(249,115,22,0.1)"
                      : "rgba(6,182,212,0.1)",
                  color: storeCategory === "Food" ? "#f97316" : "#06b6d4",
                }}
              >
                {storeCategory === "Food" ? "🍛 Food flow" : "📦 Grocery flow"}
              </span>
            </div>
            <div className="space-y-1">
              {timelineSteps.map((step, i) => {
                const isDone = i <= stepIdx;
                const isActiveStep = i === stepIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div
                      className="flex flex-col items-center"
                      style={{ width: 36, flexShrink: 0 }}
                    >
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500"
                        style={{
                          background: isDone
                            ? isActiveStep
                              ? step.color
                              : "rgba(34,197,94,0.1)"
                            : "var(--elevated)",
                          border: `2px solid ${isDone ? (isActiveStep ? step.color : "rgba(34,197,94,0.3)") : "var(--border)"}`,
                          boxShadow: isActiveStep
                            ? `0 0 18px ${step.color}45`
                            : "none",
                          transform: isActiveStep ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        <Icon
                          size={14}
                          style={{
                            color: isDone
                              ? isActiveStep
                                ? "white"
                                : "#22c55e"
                              : "var(--text-muted)",
                          }}
                        />
                      </div>
                      {i < timelineSteps.length - 1 && (
                        <div
                          className="w-0.5 h-8 mt-1 rounded-full transition-all duration-700"
                          style={{
                            background:
                              i < stepIdx
                                ? "rgba(34,197,94,0.35)"
                                : "var(--border)",
                          }}
                        />
                      )}
                    </div>
                    <div className="pt-2 pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-semibold text-sm"
                          style={{
                            color: isDone
                              ? "var(--text-primary)"
                              : "var(--text-muted)",
                          }}
                        >
                          {step.label}
                        </p>
                        {isActiveStep && (
                          <span
                            className="tag text-[10px] py-0.5 px-2 flex-shrink-0"
                            style={{
                              background: step.color + "20",
                              color: step.color,
                            }}
                          >
                            Current
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {step.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery agent */}
        {order.deliveryAgentId && (
          <div
            className="rounded-3xl p-5 mb-4"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              className="font-bold text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Delivery Partner
            </h2>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #f97316)",
                }}
              >
                🛵
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {order.deliveryAgentId?.name || "Delivery Partner"}
                </p>
                <div
                  className="flex items-center gap-2 text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Star size={10} fill="#f59e0b" stroke="none" />
                  <span style={{ color: "#f59e0b" }}>
                    {order.deliveryAgentId?.rating || "4.8"}
                  </span>
                  <span>· {order.deliveryAgentId?.vehicleType || "bike"}</span>
                </div>
                {deliveryCoords.lat != null && (
                  <p
                    className="text-xs mt-0.5 flex items-center gap-1"
                    style={{ color: "#22c55e" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live location active
                  </p>
                )}
              </div>
              {order.deliveryAgentId?.phone && (
                <a
                  href={`tel:${order.deliveryAgentId.phone}`}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    color: "#22c55e",
                  }}
                >
                  <Phone size={16} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Store info */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Store
          </h2>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "var(--elevated)" }}
            >
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                {order.storeId?.name}
              </p>
              <div
                className="flex items-center gap-1.5 text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                <span>{order.storeId?.category}</span>
                {order.storeId?.address && (
                  <>
                    <span>·</span>
                    <span className="truncate">{order.storeId.address}</span>
                  </>
                )}
              </div>
            </div>
            {order.storeId?.phone && (
              <a
                href={`tel:${order.storeId.phone}`}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: "rgba(255,107,53,0.1)",
                  color: "var(--brand)",
                }}
              >
                <Phone size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Order summary */}
        <OrderSummary
          items={order.items || []}
          subtotal={itemsSubtotal}
          deliveryFee={deliveryFee}
          discount={inferredDiscount > 0 ? inferredDiscount : 0}
          grandTotal={order.totalPrice}
          paymentMethod={order.paymentMethod}
          className="mb-4"
        />

        {/* Delivery address */}
        <div
          className="rounded-3xl p-5 mb-4"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2
            className="font-bold text-xs uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Delivery Address
          </h2>
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.1)" }}
            >
              <MapPin size={15} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {order.deliveryAddress}
              </p>
              {order.notes && (
                <p
                  className="text-xs mt-1.5 px-2 py-1 rounded-lg inline-block"
                  style={{
                    background: "var(--elevated)",
                    color: "var(--text-muted)",
                  }}
                >
                  📝 {order.notes}
                </p>
              )}
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {order.paymentMethod === "cod"
                  ? "💵 Cash on Delivery"
                  : "💳 Online Payment"}
                {order.paymentStatus === "paid" && (
                  <span className="ml-2 text-green-400 font-semibold">
                    ✓ Paid
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {isDelivered && (
            <button
              onClick={() => downloadInvoice(order._id)}
              disabled={invoiceLoading}
              className="btn btn-ghost w-full justify-center py-3 text-sm"
            >
              {invoiceLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating Invoice…
                </>
              ) : (
                <>
                  <Download size={15} />
                  Download Invoice
                </>
              )}
            </button>
          )}
          {isDelivered ? (
            <Link
              to="/user/home"
              className="btn btn-brand w-full justify-center py-4 text-base"
            >
              Order Again 🔄
            </Link>
          ) : isCancelled ? (
            <Link
              to="/user/home"
              className="btn btn-brand w-full justify-center py-4 text-base"
            >
              Browse Stores
            </Link>
          ) : (
            <button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="btn btn-ghost w-full justify-center py-3.5 text-sm"
            >
              {refreshing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
              Refresh Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
