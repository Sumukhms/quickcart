/**
 * useOrders — shared hook for fetching and filtering orders.
 *
 * Usage:
 *   const { data, loading, error, refresh, filter, setFilter, filtered } = useOrders(fetcher);
 *
 * fetcher: async function that returns the data array
 *          e.g. () => orderAPI.getMy().then((r) => r.data)
 *               () => orderAPI.getStoreOrders(storeId).then((r) => r.data)
 */
import { useState, useEffect, useCallback, useRef } from "react";

export function useOrders(fetcher, deps = []) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await fetcherRef.current();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  // Re-run when deps change (e.g. storeId becomes available)
  useEffect(() => {
    refresh();
  }, deps); // eslint-disable-line

  // Patch a single order without re-fetching
  const patchOrder = useCallback((orderId, patch) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, ...patch } : o)),
    );
  }, []);

  // Filter computed values
  const ACTIVE = [
    "pending",
    "confirmed",
    "preparing",
    "packing",
    "ready_for_pickup",
    "out_for_delivery",
  ];

  const filtered = orders.filter((o) => {
    if (filter === "active") return ACTIVE.includes(o.status);
    if (filter === "delivered") return o.status === "delivered";
    if (filter === "cancelled") return o.status === "cancelled";
    if (filter === "pending") return o.status === "pending";
    return true; // "all"
  });

  const counts = {
    all: orders.length,
    active: orders.filter((o) => ACTIVE.includes(o.status)).length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  return {
    data: orders,
    setData: setOrders,
    orders,
    filtered,
    counts,
    loading,
    error,
    filter,
    setFilter,
    refresh,
    patchOrder,
  };
}
