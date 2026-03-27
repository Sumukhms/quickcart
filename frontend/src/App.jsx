import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Common
import Navbar from "./components/Navbar.jsx";
import ToastContainer from "./components/Toast.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";

// Route guards
import { CustomerRoute, StoreRoute, DeliveryRoute } from "./routes/ProtectedRoute.jsx";

// ── Customer pages ────────────────────────────────────────────
import UserHome       from "./pages/user/UserHome.jsx";
import UserStorePage  from "./pages/user/UserStorePage.jsx";
import UserCart       from "./pages/user/UserCart.jsx";
import UserOrders     from "./pages/user/UserOrders.jsx";
import UserTrack      from "./pages/user/UserTrack.jsx";
import UserProfile    from "./pages/user/UserProfile.jsx";
import CheckoutPage   from "./pages/Checkoutpage.jsx";

// ── Store Owner pages ─────────────────────────────────────────
import StoreDashboard from "./pages/store/StoreDashboard.jsx";
import StoreProducts  from "./pages/store/StoreProducts.jsx";
import StoreOrders    from "./pages/store/StoreOrders.jsx";
import StoreSettings  from "./pages/store/StoreSettings.jsx";

// ── Delivery Partner pages ────────────────────────────────────
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard.jsx";
import DeliveryActive    from "./pages/delivery/DeliveryActive.jsx";
import DeliveryHistory   from "./pages/delivery/DeliveryHistory.jsx";

function RootRedirect() {
  const { isLoggedIn, homeRoute } = useAuth();
  return <Navigate to={isLoggedIn ? homeRoute : "/login"} replace />;
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

        {/* ── CUSTOMER ROUTES ──────────────────────────── */}
        <Route path="/user/home"          element={<CustomerRoute><UserHome /></CustomerRoute>} />
        <Route path="/user/store/:id"     element={<CustomerRoute><UserStorePage /></CustomerRoute>} />
        <Route path="/user/cart"          element={<CustomerRoute><UserCart /></CustomerRoute>} />
        <Route path="/user/orders"        element={<CustomerRoute><UserOrders /></CustomerRoute>} />
        <Route path="/user/orders/:id"    element={<CustomerRoute><UserTrack /></CustomerRoute>} />
        <Route path="/user/profile"       element={<CustomerRoute><UserProfile /></CustomerRoute>} />
        <Route path="/checkout"           element={<CustomerRoute><CheckoutPage /></CustomerRoute>} />

        {/* ── STORE OWNER ROUTES ───────────────────────── */}
        <Route path="/store/dashboard" element={<StoreRoute><StoreDashboard /></StoreRoute>} />
        <Route path="/store/products"  element={<StoreRoute><StoreProducts /></StoreRoute>} />
        <Route path="/store/orders"    element={<StoreRoute><StoreOrders /></StoreRoute>} />
        <Route path="/store/settings"  element={<StoreRoute><StoreSettings /></StoreRoute>} />

        {/* ── DELIVERY PARTNER ROUTES ──────────────────── */}
        <Route path="/delivery/dashboard" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />
        <Route path="/delivery/active"    element={<DeliveryRoute><DeliveryActive /></DeliveryRoute>} />
        <Route path="/delivery/history"   element={<DeliveryRoute><DeliveryHistory /></DeliveryRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </div>
  );
}