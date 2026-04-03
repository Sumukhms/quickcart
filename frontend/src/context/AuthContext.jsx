import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/api";

const AuthContext = createContext();

export const ROLE_HOME = {
  customer: "/user/home",
  store:    "/store/dashboard",
  delivery: "/delivery/dashboard",
  admin:    "/admin",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("qc-user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("qc-token") || null);

  const _persist = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("qc-user",  JSON.stringify(data.user));
    localStorage.setItem("qc-token", data.token);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    _persist(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  }, []);

  /**
   * logout — always clears local state.
   * Also calls the server endpoint to invalidate the refresh-token cookie.
   * Fire-and-forget: even if the server call fails we clear locally.
   */
  const logout = useCallback(async () => {
    // Best-effort server-side invalidation (clears the httpOnly cookie)
    api.post("/auth/logout").catch(() => {});

    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-token");
    localStorage.removeItem("qc-user");
  }, []);

  /**
   * logoutAll — invalidates ALL sessions for this user on the server.
   * Requires a valid access token, so call while the user is still logged in.
   */
  const logoutAll = useCallback(async () => {
    await api.post("/auth/logout-all").catch(() => {});

    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-token");
    localStorage.removeItem("qc-user");
  }, []);

  const updateUser = useCallback((updates) => {
    if (!updates) return;
    const isFullObject = updates._id || updates.id;
    const updated = isFullObject
      ? { ...updates }
      : { ...(user || {}), ...updates };
    setUser(updated);
    localStorage.setItem("qc-user", JSON.stringify(updated));
  }, [user]);

  // Called by OAuthCallback after parsing token from URL hash
  const setTokenExternal = useCallback((t) => {
    if (!t) return;
    setToken(t);
    localStorage.setItem("qc-token", t);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      logoutAll,
      updateUser,
      setTokenExternal,
      isLoggedIn:  !!user && !!token,
      isCustomer:  user?.role === "customer",
      isStore:     user?.role === "store",
      isDelivery:  user?.role === "delivery",
      isAdmin:     user?.role === "admin",
      homeRoute:   user ? (ROLE_HOME[user.role] || "/user/home") : "/login",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);