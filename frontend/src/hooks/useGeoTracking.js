/**
 * useGeoTracking.js
 * File: frontend/src/hooks/useGeoTracking.js
 *
 * Custom hook for the delivery agent side.
 * - Requests GPS permission
 * - Calls watchPosition for continuous updates
 * - Sends lat/lng to the backend every SEND_INTERVAL_MS
 * - Emits via Socket.IO as a fast path (backend persists as fallback)
 * - Cleans up on unmount / when tracking stops
 */

import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api";

const SEND_INTERVAL_MS = 5_000; // push every 5 seconds

export function useGeoTracking(orderId, isActive = false) {
  const [position,    setPosition]    = useState(null);   // { lat, lng }
  const [error,       setError]       = useState(null);   // string | null
  const [permission,  setPermission]  = useState("idle"); // idle | granted | denied | unavailable
  const [sending,     setSending]     = useState(false);

  const watchIdRef      = useRef(null);
  const lastSentRef     = useRef(0);
  const latestPosRef    = useRef(null); // always holds the freshest position
  const intervalRef     = useRef(null);
  const isMountedRef    = useRef(true);

  // ── Send latest position to backend ─────────────────────────
  const sendPosition = useCallback(async () => {
    if (!latestPosRef.current || !orderId) return;
    const { lat, lng } = latestPosRef.current;

    setSending(true);
    try {
      await api.post(`/location/${orderId}`, { lat, lng });
      lastSentRef.current = Date.now();
    } catch (err) {
      // Non-fatal: position will be sent again on next interval
      console.warn("[GeoTracking] Send failed:", err.message);
    } finally {
      if (isMountedRef.current) setSending(false);
    }
  }, [orderId]);

  // ── Start GPS watching ───────────────────────────────────────
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unavailable");
      setError("Your browser does not support GPS location.");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        latestPosRef.current = coords;
        setPosition(coords);
        setPermission("granted");
        setError(null);
      },
      (err) => {
        if (!isMountedRef.current) return;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setPermission("denied");
            setError("Location permission denied. Please enable GPS in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Make sure GPS is enabled on your device.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Retrying…");
            break;
          default:
            setError("An unknown location error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout:            10_000,
        maximumAge:         2_000,
      }
    );

    // Push interval: send the latest cached position every SEND_INTERVAL_MS
    intervalRef.current = setInterval(() => {
      if (latestPosRef.current) sendPosition();
    }, SEND_INTERVAL_MS);
  }, [sendPosition]);

  // ── Stop GPS watching ────────────────────────────────────────
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    latestPosRef.current = null;
    setPosition(null);
  }, []);

  // ── Effect: start/stop based on isActive ────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    if (isActive && orderId) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      isMountedRef.current = false;
      stopTracking();
    };
  }, [isActive, orderId, startTracking, stopTracking]);

  return {
    position,   // { lat, lng } | null
    error,      // string | null
    permission, // "idle" | "granted" | "denied" | "unavailable"
    sending,    // bool — true while HTTP push is in-flight
    startTracking,
    stopTracking,
  };
}