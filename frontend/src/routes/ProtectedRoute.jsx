import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — wraps any route that requires auth + optional role check.
 *
 * Usage:
 *   <ProtectedRoute>               → any logged-in user (all roles)
 *   <ProtectedRoute role="store">  → store owner only
 *   <ProtectedRoute role="delivery"> → delivery partner only
 *   <ProtectedRoute role="admin">  → admin only
 *
 * NOTE: CustomerRoute is intentionally kept as an ALIAS for ProtectedRoute
 * (not role-restricted) because cart, checkout, and orders are now
 * accessible to ALL roles. Any component importing CustomerRoute continues
 * to work without code changes.
 */
export default function ProtectedRoute({ children, role }) {
  const { isLoggedIn, user, homeRoute } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={homeRoute} replace />;
  }

  return children;
}

// ── Convenience wrappers ────────────────────────────────────

/**
 * CustomerRoute — NO LONGER restricted to customers only.
 * All logged-in users can reach cart/checkout/orders.
 * Kept as an alias so existing imports don't break.
 */
export function CustomerRoute({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export function StoreRoute({ children }) {
  return <ProtectedRoute role="store">{children}</ProtectedRoute>;
}

export function DeliveryRoute({ children }) {
  return <ProtectedRoute role="delivery">{children}</ProtectedRoute>;
}

export function AdminRoute({ children }) {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
}