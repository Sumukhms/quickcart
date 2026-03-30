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
    return data; // includes redirectTo
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    _persist(data);
    return data; // includes redirectTo
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-user");
    localStorage.removeItem("qc-token");
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("qc-user", JSON.stringify(updated));
  }, [user]);

  const isCustomer  = user?.role === "customer";
  const isStore     = user?.role === "store";
  const isDelivery  = user?.role === "delivery";
  const isAdmin = user?.role === "admin";
  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, updateUser,
      isLoggedIn: !!user,
      isCustomer, isStore, isDelivery,  isAdmin,
      homeRoute: user ? ROLE_HOME[user.role] : "/login",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);