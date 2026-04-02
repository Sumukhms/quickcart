/**
 * addressAPI.js
 *
 * All address-related API calls for the frontend.
 * Import and use directly in components; mirrors the backend routes.
 *
 * Usage:
 *   import { addressAPI } from "../api/addressAPI";
 *   const { data } = await addressAPI.list();
 */
import api from "./api.js";

export const addressAPI = {
  /** GET /api/addresses — returns array of Address documents */
  list: () => api.get("/addresses"),

  /** POST /api/addresses — create a new structured address */
  add: (data) => api.post("/addresses", data),

  /** PUT /api/addresses/:id — update fields */
  update: (id, data) => api.put(`/addresses/${id}`, data),

  /** DELETE /api/addresses/:id */
  remove: (id) => api.delete(`/addresses/${id}`),

  /** PATCH /api/addresses/:id/default — set as default */
  setDefault: (id) => api.patch(`/addresses/${id}/default`),

  /**
   * POST /api/addresses/from-coords
   * Reverse-geocode GPS coordinates → prefilled address fields
   * body: { lat, lng }
   */
  fromCoords: (lat, lng) => api.post("/addresses/from-coords", { lat, lng }),
};

/**
 * useGPS — browser Geolocation wrapper.
 * Returns a promise that resolves to { lat, lng } or rejects
 * with a user-friendly error string.
 *
 * Usage:
 *   const { lat, lng } = await useGPS();
 */
export function requestGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject("Your browser does not support location access.");
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            return reject(
              "Location permission denied. Please enable it in your browser settings."
            );
          case err.POSITION_UNAVAILABLE:
            return reject(
              "Your location is currently unavailable. Please enter it manually."
            );
          case err.TIMEOUT:
            return reject(
              "Location request timed out. Please try again or enter manually."
            );
          default:
            return reject("Could not get your location. Please enter manually.");
        }
      },
      { timeout: 10_000, enableHighAccuracy: false }
    );
  });
}

/**
 * Format a structured Address document into a display string.
 * Exported so any component can show a consistent one-liner.
 */
export function formatAddress(addr) {
  if (!addr) return "";
  const parts = [
    addr.street,
    addr.area,
    addr.city,
    addr.state,
    addr.pincode,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Format a short version for tight UI spaces (no state + pincode).
 */
export function formatAddressShort(addr) {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const parts = [addr.street, addr.area || addr.city].filter(Boolean);
  return parts.join(", ");
}