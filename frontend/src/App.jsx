import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import ToastContainer from "./components/Toast.jsx"
import Home from "./pages/Home.jsx"
import StorePage from "./pages/StorePage.jsx"
import { LoginPage, RegisterPage } from "./pages/AuthPages.jsx"
import OrdersPage from "./pages/OrdersPage.jsx"
import OrderTrackPage from "./pages/OrderTrackPage.jsx"
import CheckoutPage from "./pages/CheckoutPage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import SettingsPage from "./pages/SettingsPage.jsx"
import StoreDashboard from "./pages/StoreDashboard.jsx"

function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderTrackPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/dashboard" element={<StoreDashboard />} />
      </Routes>
    </div>
  )
}

export default App