import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Common
import Navbar from "./components/Navbar.jsx";
import ToastContainer from "./components/Toast.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";

// Route guards
import ProtectedRoute, { StoreRoute, DeliveryRoute } from "./routes/ProtectedRoute.jsx";
import { ForgotPasswordPage } from "./pages/AuthPages.jsx";
import OAuthCallback          from "./pages/auth/OAuthCallback.jsx";

// Admin pages
import AdminPanel from "./pages/admin/AdminPanel.jsx";

// Customer pages
import UserHome       from "./pages/user/UserHome.jsx";
import UserStorePage  from "./pages/user/UserStorePage.jsx";
import UserCart       from "./pages/user/UserCart.jsx";
import UserOrders     from "./pages/user/UserOrders.jsx";
import UserTrack      from "./pages/user/UserTrack.jsx";
import UserProfile    from "./pages/user/UserProfile.jsx";
import CheckoutPage   from "./pages/user/Checkoutpage.jsx";

// Store Owner pages
import StoreDashboard from "./pages/store/StoreDashboard.jsx";
import StoreProducts  from "./pages/store/StoreProducts.jsx";
import StoreOrders    from "./pages/store/StoreOrders.jsx";
import StoreSettings  from "./pages/store/StoreSettings.jsx";

// Delivery Partner pages
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard.jsx";
import DeliveryActive    from "./pages/delivery/DeliveryActive.jsx";
import DeliveryHistory   from "./pages/delivery/DeliveryHistory.jsx";

function RootRedirect() {
  const { isLoggedIn, homeRoute } = useAuth();
  return <Navigate to={isLoggedIn ? homeRoute : "/login"} replace />;
}

function AdminRoute({ children }) {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <ToastContainer />
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Auth */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/callback"   element={<OAuthCallback />} />

        {/* ── BROWSING — open to ALL logged-in users ── */}
        <Route path="/user/home"      element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
        <Route path="/user/store/:id" element={<ProtectedRoute><UserStorePage /></ProtectedRoute>} />

        {/* ── SHOPPING — ALL roles can buy things ── */}
        <Route path="/user/cart"       element={<ProtectedRoute><UserCart /></ProtectedRoute>} />
        <Route path="/checkout"        element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/user/orders"     element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
        <Route path="/user/orders/:id" element={<ProtectedRoute><UserTrack /></ProtectedRoute>} />
        <Route path="/user/profile"    element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* ── STORE OWNER routes ── */}
        <Route path="/store/dashboard" element={<StoreRoute><StoreDashboard /></StoreRoute>} />
        <Route path="/store/products"  element={<StoreRoute><StoreProducts /></StoreRoute>} />
        <Route path="/store/orders"    element={<StoreRoute><StoreOrders /></StoreRoute>} />
        <Route path="/store/settings"  element={<StoreRoute><StoreSettings /></StoreRoute>} />

        {/* ── DELIVERY PARTNER routes ── */}
        <Route path="/delivery/dashboard" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />
        <Route path="/delivery/active"    element={<DeliveryRoute><DeliveryActive /></DeliveryRoute>} />
        <Route path="/delivery/history"   element={<DeliveryRoute><DeliveryHistory /></DeliveryRoute>} />

        {/* ── ADMIN routes ── */}
        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </div>
  );
}