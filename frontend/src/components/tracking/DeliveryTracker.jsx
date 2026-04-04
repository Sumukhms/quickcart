/**
 * DeliveryTracker.jsx — UPDATED
 *
 * Changes vs original:
 *   1. Draws a live polyline from rider position → customer location
 *   2. Adds a destination marker (customer pin) in teal
 *   3. Both update in real-time as rider pushes new GPS coordinates
 *   4. All existing bug fixes preserved (map.remove() on unmount, destroyed guard, etc.)
 *
 * Props:
 *   orderId  {string}   – used by useOrderLocation hook
 *   order    {object}   – full order document; order.deliveryAddress used for display,
 *                         order.deliveryLocation seeded as initial rider position
 *
 * Note: "destination" coords come from the order's stored lat/lng if available.
 * If not present (most orders won't have geocoded customer coords), the polyline
 * is drawn only when both ends are known. The component degrades gracefully.
 */
import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { useOrderLocation } from "../../hooks/useOrderLocation";

let L = null;
async function getLeaflet() {
  if (L) return L;
  L = await import("leaflet");
  await import("leaflet/dist/leaflet.css");
  return L;
}

// ── Icon factories ────────────────────────────────────────────

function makeRiderIcon(leaflet) {
  return leaflet.divIcon({
    html: `
      <div style="
        width:48px; height:48px;
        background: linear-gradient(135deg,#00d4aa,#00a878);
        border-radius:50% 50% 50% 4px;
        transform: rotate(-45deg);
        display:flex; align-items:center; justify-content:center;
        box-shadow: 0 4px 20px rgba(0,212,170,0.5);
        border: 3px solid white;
      ">
        <span style="transform:rotate(45deg); font-size:20px;">🛵</span>
      </div>
      <div style="
        position:absolute; bottom:-8px; left:50%; transform:translateX(-50%);
        width:8px; height:8px; background:#00d4aa;
        border-radius:50%; animation:pulse 1.5s infinite;
        box-shadow:0 0 0 0 rgba(0,212,170,0.7);
      "></div>
    `,
    className: "",
    iconSize:  [48, 56],
    iconAnchor:[24, 56],
  });
}

function makeDestinationIcon(leaflet) {
  return leaflet.divIcon({
    html: `
      <div style="
        width:36px; height:36px;
        background: linear-gradient(135deg,#ff6b35,#e5521e);
        border-radius:50% 50% 50% 4px;
        transform: rotate(-45deg);
        display:flex; align-items:center; justify-content:center;
        box-shadow: 0 4px 16px rgba(255,107,53,0.5);
        border: 3px solid white;
      ">
        <span style="transform:rotate(45deg); font-size:16px;">🏠</span>
      </div>
    `,
    className: "",
    iconSize:  [36, 44],
    iconAnchor:[18, 44],
  });
}

function timeAgo(date) {
  if (!date) return "—";
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 5)  return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function DeliveryTracker({ orderId, order }) {
  const mapRef       = useRef(null);
  const mapObjRef    = useRef(null);
  const riderMarker  = useRef(null);
  const destMarker   = useRef(null);   // NEW: destination marker ref
  const polylineRef  = useRef(null);   // NEW: route polyline ref
  const leafletRef   = useRef(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [tick,     setTick]     = useState(0);

  const isActive = order?.status === "out_for_delivery";
  const { location, available, connected, lastUpdate } = useOrderLocation(orderId, isActive);

  // ── Derive destination coords from order ──────────────────
  // Orders don't always have geocoded customer coords.
  // We seed from order.deliveryLocation if lat/lng exist there,
  // but that's the RIDER location. For a real destination pin
  // you'd store customer lat/lng at order placement time.
  // Here we use a best-effort: if `order.customerLat` exists use it,
  // otherwise we simply skip the destination marker (no fake pin).
  const destLat = order?.customerLat ?? null;
  const destLng = order?.customerLng ?? null;
  const hasDestCoords = destLat != null && destLng != null;

  // Live clock for timeAgo
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Initialise Leaflet map ────────────────────────────────
  useEffect(() => {
    let destroyed = false;

    async function initMap() {
      if (!mapRef.current || mapObjRef.current) return;
      try {
        const lf = await getLeaflet();
        leafletRef.current = lf.default ?? lf;
        const Lf = leafletRef.current;

        if (destroyed || !mapRef.current) return;

        const center = location
          ? [location.lat, location.lng]
          : hasDestCoords
          ? [destLat, destLng]
          : [12.9716, 77.5946];  // Bengaluru fallback

        const map = Lf.map(mapRef.current, {
          center,
          zoom: 15,
          zoomControl: true,
          scrollWheelZoom: true,
          attributionControl: false,
        });

        Lf.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          { maxZoom: 19 }
        ).addTo(map);

        mapObjRef.current = map;

        // ── Place destination marker immediately if coords known ──
        if (hasDestCoords && !destroyed) {
          destMarker.current = Lf.marker([destLat, destLng], {
            icon: makeDestinationIcon(Lf),
            zIndexOffset: 500,
          })
            .addTo(map)
            .bindPopup("Delivery destination");
        }

        setMapReady(true);
      } catch {
        setMapError("Could not load map. Please check your internet connection.");
      }
    }

    initMap();

    return () => {
      destroyed = true;
      if (polylineRef.current) {
        try { polylineRef.current.remove(); } catch {}
        polylineRef.current = null;
      }
      if (destMarker.current) {
        try { destMarker.current.remove(); } catch {}
        destMarker.current = null;
      }
      if (mapObjRef.current) {
        try { mapObjRef.current.remove(); } catch {}
        mapObjRef.current = null;
      }
      riderMarker.current = null;
    };
  }, []); // eslint-disable-line

  // ── Update rider marker + polyline when location changes ──
  useEffect(() => {
    if (!mapReady || !location || !mapObjRef.current) return;
    const Lf  = leafletRef.current;
    const map = mapObjRef.current;
    const pos = [location.lat, location.lng];

    // --- Rider marker ---
    if (!riderMarker.current) {
      riderMarker.current = Lf.marker(pos, {
        icon: makeRiderIcon(Lf),
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      riderMarker.current.setLatLng(pos);
    }

    map.panTo(pos, { animate: true, duration: 0.8, easeLinearity: 0.5 });

    // --- Polyline: rider → customer ---
    // Only draw if we have both ends
    if (hasDestCoords) {
      const latlngs = [pos, [destLat, destLng]];
      if (!polylineRef.current) {
        polylineRef.current = Lf.polyline(latlngs, {
          color:     "#ff6b35",
          weight:    3,
          opacity:   0.75,
          dashArray: "8 6",   // dashed line for "route in progress" feel
        }).addTo(map);
      } else {
        polylineRef.current.setLatLngs(latlngs);
      }

      // Fit map to show both points when line first appears
      if (polylineRef.current) {
        try {
          map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
        } catch {
          // Ignore fitBounds errors on tiny distances
        }
      }
    }
  }, [location, mapReady, hasDestCoords, destLat, destLng]);

  // ── Place / update destination marker reactively ─────────
  // (handles the case where order data arrives after map init)
  useEffect(() => {
    if (!mapReady || !mapObjRef.current || !hasDestCoords) return;
    const Lf = leafletRef.current;
    const map = mapObjRef.current;

    if (!destMarker.current) {
      destMarker.current = Lf.marker([destLat, destLng], {
        icon: makeDestinationIcon(Lf),
        zIndexOffset: 500,
      })
        .addTo(map)
        .bindPopup("Delivery destination");
    }
  }, [mapReady, hasDestCoords, destLat, destLng]);

  if (!isActive) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="text-4xl mb-2">📍</div>
        <p className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>
          Live tracking will appear once the rider picks up your order.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background:  "var(--card)",
        border:      "1px solid var(--border)",
        boxShadow:   "0 8px 40px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background:   "linear-gradient(135deg,#00d4aa15,#00a87808)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,212,170,0.15)", border: "1px solid rgba(0,212,170,0.3)" }}
          >
            <Navigation size={18} style={{ color: "#00d4aa" }} />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Live Delivery Tracking
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Updated {timeAgo(lastUpdate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Legend chips */}
          {hasDestCoords && (
            <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1">
                <span style={{ display: "inline-block", width: 16, height: 2, background: "#ff6b35", borderRadius: 1, verticalAlign: "middle" }} />
                Route
              </span>
              <span className="flex items-center gap-1">🏠 Destination</span>
            </div>
          )}
          {available ? (
            <span
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(0,212,170,0.12)", color: "#00d4aa", border: "1px solid rgba(0,212,170,0.25)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              LIVE
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
            >
              <RefreshCw size={11} className="animate-spin" />
              Waiting
            </span>
          )}
        </div>
      </div>

      {/* Map container */}
      <div style={{ position: "relative", height: 320 }}>
        {mapError ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "var(--elevated)" }}
          >
            <MapPin size={32} style={{ color: "#ef4444" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              {mapError}
            </p>
          </div>
        ) : (
          <>
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
            {!available && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              >
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,212,170,0.2)", border: "2px solid rgba(0,212,170,0.5)" }}
                  >
                    <span className="text-3xl">🛵</span>
                  </div>
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: "rgba(0,212,170,0.15)", animationDuration: "1.5s" }}
                  />
                </div>
                <p className="text-white font-semibold text-sm">Locating your rider…</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Info strip */}
      <div
        className="grid grid-cols-3 divide-x"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {[
          {
            icon:  "📍",
            label: "Coordinates",
            value: available
              ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
              : "—",
          },
          {
            icon:  "⏱️",
            label: "Last Update",
            value: timeAgo(lastUpdate),
          },
          {
            icon:  connected ? "📡" : "📶",
            label: "Connection",
            value: connected ? "Socket" : "Polling",
          },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 py-3 px-2"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-base">{icon}</span>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="text-xs font-semibold text-center" style={{ color: "var(--text-primary)" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(0,212,170,0.7); }
          70%  { box-shadow: 0 0 0 12px rgba(0,212,170,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,212,170,0); }
        }
      `}</style>
    </div>
  );
}