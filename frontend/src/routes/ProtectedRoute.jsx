import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — wraps any route that requires auth + optional role check.
 *
 * Usage:
 *   <ProtectedRoute>                          → any logged-in user
 *   <ProtectedRoute role="customer">          → customer only
 *   <ProtectedRoute role="store">             → store owner only
 *   <ProtectedRoute role="delivery">          → delivery partner only
 */
export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, user, homeRoute } = useAuth();
  const location = useLocation();

  // Not logged in → send to login
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role mismatch → send to their own home
  if (role && user.role !== role) {
    return <Navigate to={homeRoute} replace />;
  }

  return children;
}

// Convenience wrappers
export function CustomerRoute({ children }) {
  return <ProtectedRoute role="customer">{children}</ProtectedRoute>;
}

export function StoreRoute({ children }) {
  return <ProtectedRoute role="store">{children}</ProtectedRoute>;
}

export function DeliveryRoute({ children }) {
  return <ProtectedRoute role="delivery">{children}</ProtectedRoute>;
}