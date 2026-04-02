/**
 * distance.js
 *
 * Haversine formula — calculates the great-circle distance between
 * two points on Earth given their lat/lng in decimal degrees.
 *
 * Returns distance in metres.
 *
 * Used by:
 *   - Frontend: show "Delivery is near" when distance < 500 m
 *   - Backend: could be used for delivery-zone validation
 *
 * Pure function — no side effects, no imports needed.
 */

const EARTH_RADIUS_M = 6_371_000; // metres

/**
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in metres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

/**
 * Human-readable distance string.
 * < 1000 m  → "450 m"
 * ≥ 1000 m  → "2.3 km"
 */
export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/**
 * Returns a proximity level based on distance.
 * Used to colour-code the "delivery is near" badge.
 */
export function getProximityLevel(metres) {
  if (metres <= 200)  return "arriving";   // ≤ 200 m  – "Arriving now"
  if (metres <= 500)  return "near";       // ≤ 500 m  – "Very close"
  if (metres <= 1500) return "close";      // ≤ 1.5 km – "On the way"
  return "far";                            // > 1.5 km – show distance only
}