import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/api";

const AuthContext = createContext();

export const ROLE_HOME = {
  customer: "/user/home",
  store:    "/store/dashboard",
  delivery: "/delivery/dashboard",
  admin:    "/admin",
};

// ✅ FIX: normalize user object so both user.id and user._id always exist
function normalizeUser(user) {
  if (!user) return null;
  return {
    ...user,
    // ✅ Backend returns _id for mongoose docs, id for safeUser() output
    // Ensure both are always present
    id: user.id || user._id,
    _id: user._id || user.id,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("qc-user");
      return raw ? normalizeUser(JSON.parse(raw)) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("qc-token") || null);

  const _persist = (data) => {
    const normalized = normalizeUser(data.user);
    setUser(normalized);
    setToken(data.token);
    localStorage.setItem("qc-user",  JSON.stringify(normalized));
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

  const logout = useCallback(async () => {
    api.post("/auth/logout").catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-token");
    localStorage.removeItem("qc-user");
  }, []);

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
    const merged = isFullObject
      ? { ...updates }
      : { ...(user || {}), ...updates };
    const normalized = normalizeUser(merged);
    setUser(normalized);
    localStorage.setItem("qc-user", JSON.stringify(normalized));
  }, [user]);

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