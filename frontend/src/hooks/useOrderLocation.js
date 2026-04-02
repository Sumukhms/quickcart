/**
 * useOrderLocation.js
 * File: frontend/src/hooks/useOrderLocation.js
 *
 * Customer-side hook.
 * Primary source:  Socket.IO "location_update" events (real-time)
 * Fallback source: HTTP GET /api/location/:orderId polled every 8 s
 *                  (used when socket is disconnected)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/api";
import { useSocket } from "../context/SocketContext";

const POLL_INTERVAL_MS = 8_000;

export function useOrderLocation(orderId, isActive = false) {
  const { on, joinOrderRoom } = useSocket();

  const [location,   setLocation]   = useState(null);  // { lat, lng, updatedAt }
  const [available,  setAvailable]  = useState(false);
  const [connected,  setConnected]  = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const pollRef    = useRef(null);
  const mountedRef = useRef(true);

  // ── Poll REST API as fallback ────────────────────────────────
  const pollLocation = useCallback(async () => {
    if (!orderId || !mountedRef.current) return;
    try {
      const { data } = await api.get(`/location/${orderId}`);
      if (!mountedRef.current) return;
      if (data.available) {
        setLocation({ lat: data.lat, lng: data.lng, updatedAt: data.updatedAt });
        setAvailable(true);
        setLastUpdate(new Date(data.updatedAt));
      }
    } catch {
      // Silently ignore poll failures
    }
  }, [orderId]);

  // ── Socket.IO listener ───────────────────────────────────────
  useEffect(() => {
    if (!orderId || !isActive) return;

    // Join the socket room for this order
    joinOrderRoom(orderId);
    setConnected(true);

    // Listen for location pushes from the delivery agent
    const unsub = on("location_update", ({ orderId: eventOrderId, lat, lng, updatedAt }) => {
      if (eventOrderId !== orderId && eventOrderId?.toString() !== orderId) return;
      if (!mountedRef.current) return;
      setLocation({ lat, lng, updatedAt });
      setAvailable(true);
      setLastUpdate(new Date(updatedAt));
    });

    return () => {
      setConnected(false);
      if (typeof unsub === "function") unsub();
    };
  }, [orderId, isActive, on, joinOrderRoom]);

  // ── REST fallback polling ────────────────────────────────────
  useEffect(() => {
    if (!orderId || !isActive) return;

    // Initial fetch
    pollLocation();

    // Poll every 8 s (Socket.IO updates arrive faster; polling is the safety net)
    pollRef.current = setInterval(pollLocation, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, isActive, pollLocation]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return {
    location,   // { lat, lng, updatedAt } | null
    available,  // bool
    connected,  // bool (socket)
    lastUpdate, // Date | null
  };
}