/**
 * GpsTracker.jsx
 * File: frontend/src/components/tracking/GpsTracker.jsx
 *
 * Delivery-agent side: toggle GPS tracking on/off.
 * Drop this into DeliveryActive.jsx next to the "Mark Delivered" button.
 *
 * Usage:
 *   import GpsTracker from "../../components/tracking/GpsTracker";
 *   ...
 *   {order && <GpsTracker orderId={order._id} isDelivering={currentStep >= 1} />}
 */

import { useState, useEffect } from "react";
import {
  Navigation, MapPin, AlertTriangle,
  CheckCircle, Loader2, WifiOff, Signal,
} from "lucide-react";
import { useGeoTracking } from "../../hooks/useGeoTracking";

// ── Accuracy badge ────────────────────────────────────────────
function AccuracyDot({ permission }) {
  const map = {
    granted:     { color: "#00d4aa", label: "GPS active",    pulse: true  },
    denied:      { color: "#ef4444", label: "Permission denied", pulse: false },
    unavailable: { color: "#f59e0b", label: "GPS unavailable", pulse: false },
    idle:        { color: "#5a5a6e", label: "Idle",          pulse: false },
  };
  const cfg = map[permission] || map.idle;
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: cfg.color }}>
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: cfg.color,
          animation: cfg.pulse ? "pulseDot 1.5s infinite" : "none",
        }}
      />
      {cfg.label}
    </span>
  );
}

export default function GpsTracker({ orderId, isDelivering = false }) {
  const [trackingOn, setTrackingOn] = useState(false);

  // Auto-start when delivering begins
  useEffect(() => {
    if (isDelivering) setTrackingOn(true);
    else              setTrackingOn(false);
  }, [isDelivering]);

  const { position, error, permission, sending } = useGeoTracking(orderId, trackingOn);

  if (!orderId) return null;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background:   "var(--card)",
        border:       `1.5px solid ${trackingOn && permission === "granted" ? "rgba(0,212,170,0.35)" : "var(--border)"}`,
        transition:   "border-color 0.3s ease",
        boxShadow:    trackingOn && permission === "granted"
          ? "0 0 30px rgba(0,212,170,0.12)"
          : "none",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background:   trackingOn && permission === "granted"
            ? "linear-gradient(135deg,rgba(0,212,170,0.1),rgba(0,168,120,0.05))"
            : "var(--elevated)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{
              background: trackingOn && permission === "granted"
                ? "rgba(0,212,170,0.15)"
                : "var(--elevated)",
              border: `1px solid ${trackingOn && permission === "granted" ? "rgba(0,212,170,0.3)" : "var(--border)"}`,
            }}
          >
            <Navigation
              size={18}
              style={{ color: trackingOn && permission === "granted" ? "#00d4aa" : "var(--text-muted)" }}
            />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              GPS Location Sharing
            </p>
            <AccuracyDot permission={trackingOn ? permission : "idle"} />
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setTrackingOn(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            background: trackingOn
              ? "rgba(239,68,68,0.1)"
              : "linear-gradient(135deg,#00d4aa,#00a878)",
            color:      trackingOn ? "#ef4444" : "white",
            border:     trackingOn ? "1px solid rgba(239,68,68,0.3)" : "none",
            boxShadow:  !trackingOn ? "0 4px 16px rgba(0,212,170,0.35)" : "none",
          }}
        >
          {trackingOn ? "Stop" : "Share Location"}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 space-y-3">

        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-3 p-3 rounded-2xl text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
          >
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Coordinates readout */}
        {position && trackingOn ? (
          <div
            className="grid grid-cols-2 gap-3"
          >
            {[
              { label: "Latitude",  value: position.lat.toFixed(6) },
              { label: "Longitude", value: position.lng.toFixed(6) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-2xl p-3"
                style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {label}
                </p>
                <p
                  className="text-sm font-bold font-mono"
                  style={{ color: "#00d4aa" }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          !error && (
            <div
              className="flex flex-col items-center gap-2 py-4"
              style={{ color: "var(--text-muted)" }}
            >
              <MapPin size={28} />
              <p className="text-sm font-semibold">
                {trackingOn ? "Acquiring GPS signal…" : "Location sharing is off"}
              </p>
              {trackingOn && (
                <Loader2 size={16} className="animate-spin" style={{ color: "#00d4aa" }} />
              )}
            </div>
          )
        )}

        {/* Sending indicator */}
        {trackingOn && permission === "granted" && (
          <div
            className="flex items-center justify-between text-xs px-3 py-2 rounded-xl"
            style={{ background: "var(--elevated)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>Broadcasting every 5s</span>
            {sending ? (
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#00d4aa" }}>
                <Signal size={12} /> Sending…
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#22c55e" }}>
                <CheckCircle size={12} /> Sent
              </span>
            )}
          </div>
        )}

        {/* Privacy note */}
        <p
          className="text-[10px] text-center"
          style={{ color: "var(--text-muted)" }}
        >
          📍 Only shared while this order is active. Stops automatically on delivery.
        </p>
      </div>
    </div>
  );
}