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
    localStorage.setItem("qc-user", JSON.stringify(data.user));
    localStorage.setItem("qc-token", data.token);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    _persist(data);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    // Registration returns { requiresVerification, email } — no token yet
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-user");
    localStorage.removeItem("qc-token");
  }, []);

  const updateUser = useCallback((updates) => {
    if (!updates) return;
    // If a full user object is passed (has _id or id), replace entirely
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