import { createContext, useContext, useState } from "react";
import api from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("qc-user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("qc-token"));

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("qc-user", JSON.stringify(data.user));
    localStorage.setItem("qc-token", data.token);
    return data;
  };

  const register = async (name, email, password, role = "customer") => {
    const { data } = await api.post("/auth/register", { name, email, password, role });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("qc-user", JSON.stringify(data.user));
    localStorage.setItem("qc-token", data.token);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("qc-user");
    localStorage.removeItem("qc-token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);