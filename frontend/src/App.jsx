import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Common components (keep static for layout)
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ToastContainer from "./components/Toast.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ScrollToTop from "./components/ScrollToTop";

// Route guards
import ProtectedRoute, {
  StoreRoute,
  DeliveryRoute,
} from "./routes/ProtectedRoute.jsx";

// Auth Pages (Lazy)
const LoginPage = lazy(() => import("./pages/AuthPages.jsx").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/AuthPages.jsx").then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import("./pages/AuthPages.jsx").then(m => ({ default: m.ForgotPasswordPage })));
const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback.jsx"));
const RoleSelectionPage = lazy(() => import("./pages/auth/RoleSelectionPage.jsx"));

// Admin pages (Lazy)
const AdminPanel = lazy(() => import("./pages/admin/AdminPanel.jsx"));

// Customer pages (Lazy)
const UserHome = lazy(() => import("./pages/user/UserHome.jsx"));
const UserStorePage = lazy(() => import("./pages/user/UserStorePage.jsx"));
const UserCart = lazy(() => import("./pages/user/UserCart.jsx"));
const UserOrders = lazy(() => import("./pages/user/UserOrders.jsx"));
const UserTrack = lazy(() => import("./pages/user/UserTrack.jsx"));
const UserProfile = lazy(() => import("./pages/user/UserProfile.jsx"));
const CheckoutPage = lazy(() => import("./pages/user/Checkoutpage.jsx"));
const PaymentFailurePage = lazy(() => import("./pages/user/PaymentFailurePage.jsx"));

// Store Owner pages (Lazy)
const StoreDashboard = lazy(() => import("./pages/store/StoreDashboard.jsx"));
const StoreProducts = lazy(() => import("./pages/store/StoreProducts.jsx"));
const StoreOrders = lazy(() => import("./pages/store/StoreOrders.jsx"));
const StoreSettings = lazy(() => import("./pages/store/StoreSettings.jsx"));
const StoreCoupons = lazy(() => import("./pages/store/StoreCoupons.jsx"));
const StoreInventory = lazy(() => import("./pages/store/StoreInventory.jsx"));

// Delivery Partner pages (Lazy)
const DeliveryDashboard = lazy(() => import("./pages/delivery/DeliveryDashboard.jsx"));
const DeliveryActive = lazy(() => import("./pages/delivery/DeliveryActive.jsx"));
const DeliveryHistory = lazy(() => import("./pages/delivery/DeliveryHistory.jsx"));

const StaticPage = lazy(() => import("./pages/StaticPage"));

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
    <div className="flex flex-col min-h-[100dvh]">
      <ScrollToTop />
      <ToastContainer />
      <Navbar />
      <BottomNav />

      <main className="flex-1 pb-24 md:pb-0">
        <Suspense fallback={
          <div className="w-full h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[var(--brand)] border-t-transparent animate-spin" />
          </div>
        }>
          <Routes>
            {/* Root */}
            <Route path="/" element={<RootRedirect />} />

            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/auth/select-role" element={<RoleSelectionPage />} />

            {/* ── STATIC INFO PAGES ── */}
            <Route path="/about" element={<StaticPage />} />
            <Route path="/help" element={<StaticPage />} />
            <Route path="/terms" element={<StaticPage />} />
            <Route path="/careers" element={<StaticPage />} />

            {/* Browsing — all logged-in users */}
            <Route
              path="/user/home"
              element={
                <ProtectedRoute>
                  <UserHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/store/:id"
              element={
                <ProtectedRoute>
                  <UserStorePage />
                </ProtectedRoute>
              }
            />

            {/* Shopping — all roles */}
            <Route
              path="/user/cart"
              element={
                <ProtectedRoute>
                  <UserCart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders"
              element={
                <ProtectedRoute>
                  <UserOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/orders/:id"
              element={
                <ProtectedRoute>
                  <UserTrack />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/failure"
              element={
                <ProtectedRoute>
                  <PaymentFailurePage />
                </ProtectedRoute>
              }
            />

            {/* Store Owner routes */}
            <Route
              path="/store/dashboard"
              element={
                <StoreRoute>
                  <StoreDashboard />
                </StoreRoute>
              }
            />
            <Route
              path="/store/products"
              element={
                <StoreRoute>
                  <StoreProducts />
                </StoreRoute>
              }
            />
            <Route
              path="/store/orders"
              element={
                <StoreRoute>
                  <StoreOrders />
                </StoreRoute>
              }
            />
            <Route
              path="/store/settings"
              element={
                <StoreRoute>
                  <StoreSettings />
                </StoreRoute>
              }
            />
            <Route
              path="/store/coupons"
              element={
                <StoreRoute>
                  <StoreCoupons />
                </StoreRoute>
              }
            />
            <Route
              path="/store/inventory"
              element={
                <StoreRoute>
                  <StoreInventory />
                </StoreRoute>
              }
            />

            {/* Delivery Partner routes */}
            <Route
              path="/delivery/dashboard"
              element={
                <DeliveryRoute>
                  <DeliveryDashboard />
                </DeliveryRoute>
              }
            />
            <Route
              path="/delivery/active"
              element={
                <DeliveryRoute>
                  <DeliveryActive />
                </DeliveryRoute>
              }
            />
            <Route
              path="/delivery/history"
              element={
                <DeliveryRoute>
                  <DeliveryHistory />
                </DeliveryRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
