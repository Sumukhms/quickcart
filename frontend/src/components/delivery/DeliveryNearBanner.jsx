/**
 * DeliveryNearBanner.jsx
 *
 * Shows a live proximity banner on the UserTrack page when the
 * delivery partner's GPS location is known.
 *
 * Props:
 *   deliveryLat   {number|null}  – delivery agent's lat (from socket)
 *   deliveryLng   {number|null}  – delivery agent's lng (from socket)
 *   userLat       {number|null}  – customer's lat (from saved address)
 *   userLng       {number|null}  – customer's lng (from saved address)
 *   status        {string}       – order status
 *
 * Emits nothing — purely presentational.
 *
 * Distance thresholds:
 *   ≤ 200 m  → "Arriving now!" (green, pulsing)
 *   ≤ 500 m  → "Delivery is very close" (amber)
 *   ≤ 1500 m → "On the way — X km" (brand orange)
 *   > 1500 m → no banner shown
 */
import { haversineDistance, formatDistance, getProximityLevel } from "../../utils/distance.js";

const PROXIMITY_CONFIG = {
  arriving: {
    emoji: "🔔",
    title: "Arriving now!",
    sub:   "Your delivery partner is right outside",
    bg:    "rgba(34,197,94,0.1)",
    border:"rgba(34,197,94,0.3)",
    color: "#22c55e",
    pulse: true,
  },
  near: {
    emoji: "🛵",
    title: "Delivery is very close",
    sub:   "Your order will arrive in a minute or two",
    bg:    "rgba(245,158,11,0.1)",
    border:"rgba(245,158,11,0.3)",
    color: "#f59e0b",
    pulse: true,
  },
  close: {
    emoji: "📍",
    title: "On the way",
    sub:   null,   // filled dynamically with distance
    bg:    "rgba(255,107,53,0.08)",
    border:"rgba(255,107,53,0.22)",
    color: "var(--brand)",
    pulse: false,
  },
};

export default function DeliveryNearBanner({
  deliveryLat,
  deliveryLng,
  userLat,
  userLng,
  status,
}) {
  // Only show when order is out for delivery and we have both coords
  if (status !== "out_for_delivery") return null;
  if (deliveryLat == null || deliveryLng == null) return null;
  if (userLat    == null || userLng     == null) return null;

  const metres   = haversineDistance(deliveryLat, deliveryLng, userLat, userLng);
  const level    = getProximityLevel(metres);

  if (level === "far") return null;   // > 1.5 km — don't clutter UI

  const cfg = PROXIMITY_CONFIG[level];
  const sub = level === "close"
    ? `Your rider is ${formatDistance(metres)} away`
    : cfg.sub;

  return (
    <div
      className="rounded-2xl p-4 mb-4 flex items-center gap-4 transition-all"
      style={{
        background: cfg.bg,
        border:     `1.5px solid ${cfg.border}`,
        animation:  cfg.pulse ? "pulseRing 2s ease-in-out infinite" : "none",
      }}
    >
      {/* Pulsing dot */}
      <span className="relative inline-flex h-3 w-3 flex-shrink-0">
        {cfg.pulse && (
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: cfg.color }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-3 w-3"
          style={{ background: cfg.color }}
        />
      </span>

      {/* Icon */}
      <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{cfg.emoji}</span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: cfg.color }}>
          {cfg.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {sub}
        </p>
      </div>

      {/* Distance badge */}
      {level !== "arriving" && (
        <div
          className="flex-shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-xl"
          style={{ background: cfg.color + "15", color: cfg.color }}
        >
          {formatDistance(metres)}
        </div>
      )}
    </div>
  );
}