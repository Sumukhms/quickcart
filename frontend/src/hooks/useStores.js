/**
 * useStores — fetch + filter stores with category and search support.
 *
 * Usage:
 *   const { data, loading, error, search, setSearch, category, setCategory, refresh } = useStores();
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { storeAPI } from "../api/api";

export function useStores(initialCategory = "All") {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const debounceRef = useRef(null);

  const fetch = useCallback(async (q, cat) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (q) params.search = q;
      if (cat !== "All") params.category = cat;
      const { data } = await storeAPI.getAll(params);
      setStores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load stores");
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search + category fetch
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetch(search, category), 250);
    return () => clearTimeout(debounceRef.current);
  }, [search, category, fetch]);

  const refresh = useCallback(
    () => fetch(search, category),
    [search, category, fetch],
  );

  return {
    data: stores,
    setData: setStores,
    stores,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    refresh,
  };
}
