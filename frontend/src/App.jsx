import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Common
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ToastContainer from "./components/Toast.jsx";
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx";

// Route guards
import ProtectedRoute, {
  StoreRoute,
  DeliveryRoute,
} from "./routes/ProtectedRoute.jsx";
import { ForgotPasswordPage } from "./pages/AuthPages.jsx";
import OAuthCallback from "./pages/auth/OAuthCallback.jsx";

// Admin pages
import AdminPanel from "./pages/admin/AdminPanel.jsx";

// Customer pages
import UserHome from "./pages/user/UserHome.jsx";
import UserStorePage from "./pages/user/UserStorePage.jsx";
import UserCart from "./pages/user/UserCart.jsx";
import UserOrders from "./pages/user/UserOrders.jsx";
import UserTrack from "./pages/user/UserTrack.jsx";
import UserProfile from "./pages/user/UserProfile.jsx";
import CheckoutPage from "./pages/user/Checkoutpage.jsx";

// Store Owner pages
import StoreDashboard from "./pages/store/StoreDashboard.jsx";
import StoreProducts from "./pages/store/StoreProducts.jsx";
import StoreOrders from "./pages/store/StoreOrders.jsx";
import StoreSettings from "./pages/store/StoreSettings.jsx";
import StoreCoupons from "./pages/store/StoreCoupons.jsx";
import StoreInventory from "./pages/store/StoreInventory.jsx";  // NEW

// Delivery Partner pages
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard.jsx";
import DeliveryActive from "./pages/delivery/DeliveryActive.jsx";
import DeliveryHistory from "./pages/delivery/DeliveryHistory.jsx";

import ScrollToTop from "./components/ScrollToTop";
import StaticPage from "./pages/StaticPage";

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
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <ScrollToTop />
      <Navbar />
      <ToastContainer />

      <main className="flex-1">
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />

          {/* ── STATIC INFO PAGES ── */}
          <Route path="/about" element={<StaticPage />} />
          <Route path="/help" element={<StaticPage />} />
          <Route path="/terms" element={<StaticPage />} />
          <Route path="/careers" element={<StaticPage />} />

          {/* Browsing — all logged-in users */}
          <Route path="/user/home" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
          <Route path="/user/store/:id" element={<ProtectedRoute><UserStorePage /></ProtectedRoute>} />

          {/* Shopping — all roles */}
          <Route path="/user/cart" element={<ProtectedRoute><UserCart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/user/orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
          <Route path="/user/orders/:id" element={<ProtectedRoute><UserTrack /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

          {/* Store Owner routes */}
          <Route path="/store/dashboard" element={<StoreRoute><StoreDashboard /></StoreRoute>} />
          <Route path="/store/products"  element={<StoreRoute><StoreProducts /></StoreRoute>} />
          <Route path="/store/orders"    element={<StoreRoute><StoreOrders /></StoreRoute>} />
          <Route path="/store/settings"  element={<StoreRoute><StoreSettings /></StoreRoute>} />
          <Route path="/store/coupons"   element={<StoreRoute><StoreCoupons /></StoreRoute>} />
          <Route path="/store/inventory" element={<StoreRoute><StoreInventory /></StoreRoute>} />  {/* NEW */}

          {/* Delivery Partner routes */}
          <Route path="/delivery/dashboard" element={<DeliveryRoute><DeliveryDashboard /></DeliveryRoute>} />
          <Route path="/delivery/active"    element={<DeliveryRoute><DeliveryActive /></DeliveryRoute>} />
          <Route path="/delivery/history"   element={<DeliveryRoute><DeliveryHistory /></DeliveryRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}