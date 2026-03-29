/**
 * FavoriteContext.jsx
 *
 * Provides favorite store state + toggle action across the app.
 * Automatically loads the user's favorites on mount (if logged in as customer).
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { favoriteAPI } from "../api/api";
import { useAuth }     from "./AuthContext";

const FavoriteContext = createContext();

export function FavoriteProvider({ children }) {
  const { isLoggedIn, isCustomer } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());   // Set of storeId strings
  const [favorites,   setFavorites]   = useState([]);           // full store objects
  const [loading,     setLoading]     = useState(false);

  // Load favorites when user logs in as customer
  useEffect(() => {
    if (isLoggedIn && isCustomer) {
      fetchFavorites();
    } else {
      setFavoriteIds(new Set());
      setFavorites([]);
    }
  }, [isLoggedIn, isCustomer]);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await favoriteAPI.getAll();
      setFavorites(data);
      setFavoriteIds(new Set(data.map((s) => s._id)));
    } catch {
      // silently ignore — favorites are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (storeId) => {
    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });

    try {
      const { data } = await favoriteAPI.toggle(storeId);
      setFavoriteIds(new Set(data.favoriteStores.map((id) => id.toString())));
      // Re-fetch full objects to keep favorites list accurate
      fetchFavorites();
    } catch {
      // Revert optimistic update on error
      fetchFavorites();
    }
  }, [fetchFavorites]);

  const isFavorite = useCallback(
    (storeId) => favoriteIds.has(storeId?.toString()),
    [favoriteIds]
  );

  return (
    <FavoriteContext.Provider value={{ favorites, favoriteIds, isFavorite, toggleFavorite, loading, fetchFavorites }}>
      {children}
    </FavoriteContext.Provider>
  );
}

export const useFavorites = () => useContext(FavoriteContext);