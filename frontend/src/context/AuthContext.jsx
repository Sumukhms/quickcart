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
    try { return JSON.parse(localStorage.getItem("qc-user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("qc-token"));

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
    // Registration no longer returns a token — returns { requiresVerification, email }
    return data;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-user");
    localStorage.removeItem("qc-token");
  }, []);

  const updateUser = useCallback((updates) => {
    // Accepts either a full user object or a partial patch
    const updated = updates._id
      ? { ...updates }                 // full object (from OAuth callback)
      : { ...(user || {}), ...updates }; // partial patch
    setUser(updated);
    localStorage.setItem("qc-user", JSON.stringify(updated));
  }, [user]);

  // Called by OAuthCallback after storing token manually
  const setTokenExternal = useCallback((t) => {
    setToken(t);
    localStorage.setItem("qc-token", t);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, updateUser, setTokenExternal,
      isLoggedIn:  !!user,
      isCustomer:  user?.role === "customer",
      isStore:     user?.role === "store",
      isDelivery:  user?.role === "delivery",
      isAdmin:     user?.role === "admin",
      homeRoute:   user ? ROLE_HOME[user.role] : "/login",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);