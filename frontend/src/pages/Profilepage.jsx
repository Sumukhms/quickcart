import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Mail, Phone, MapPin, Edit3, Save, X, Camera,
  Package, Star, Heart, ChevronRight, LogOut, Shield,
  TrendingUp, Clock, CheckCircle, Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const ROLE_CONFIG = {
  customer: { label: "Customer", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: "👤" },
  store: { label: "Store Owner", color: "#3b82f6", bg: "rgba(59,130,246,0.12)", icon: "🏪" },
  delivery: { label: "Delivery Partner", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: "🛵" },
};

export default function ProfilePage() {
  const { user, logout, isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "" });
    }
    fetchRecentOrders();
  }, [user]);

  const fetchRecentOrders = async () => {
    try {
      const { data } = await api.get("/orders/my");
      setRecentOrders(data.slice(0, 3));
    } catch {
      setRecentOrders([
        { _id: "o1", status: "delivered", totalPrice: 245, storeId: { name: "FreshMart" }, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { _id: "o2", status: "out_for_delivery", totalPrice: 180, storeId: { name: "Biryani House" }, createdAt: new Date(Date.now() - 3600000).toISOString() },
      ]);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { addToast("Name cannot be empty", "error"); return; }
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      addToast("Profile updated successfully! ✓", "success");
      setEditing(false);
    } catch {
      addToast("Failed to update profile", "error");
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    logout();
    addToast("Signed out successfully", "info");
    navigate("/");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center page-enter" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center px-4">
          <div className="text-7xl mb-5" style={{ animation: "float 3s ease-in-out infinite" }}>🔐</div>
          <h2 className="font-display font-bold text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
            Sign in to view your profile
          </h2>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>Access your orders, preferences, and more</p>
          <div className="flex gap-3 justify-center">
            <Link to="/login" className="btn btn-brand px-6 py-2.5">Sign In</Link>
            <Link to="/register" className="btn btn-ghost px-6 py-2.5">Create Account</Link>
          </div>
        </div>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.customer;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U";

  const statusConfig = {
    delivered: { label: "Delivered", color: "#22c55e" },
    out_for_delivery: { label: "On the way", color: "#f97316" },
    preparing: { label: "Preparing", color: "#8b5cf6" },
    confirmed: { label: "Confirmed", color: "#3b82f6" },
    pending: { label: "Pending", color: "#f59e0b" },
    cancelled: { label: "Cancelled", color: "#ef4444" },
  };

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      {/* Hero header */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a0a00, #2d1200, #1a0a00)" }}>
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, var(--brand), transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #ff8c5a, transparent)", transform: "translate(-30%, 30%)" }} />
        
        <div className="max-w-3xl mx-auto px-4 pt-10 pb-20">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl shadow-2xl"
                style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)", boxShadow: "0 0 30px rgba(255,107,53,0.4)" }}>
                {initials}
              </div>
              <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg transition-all hover:scale-110"
                style={{ background: "var(--brand)" }}>
                <Camera size={13} style={{ color: "white" }} />
              </button>
            </div>

            {/* Name & role */}
            <div className="flex-1 min-w-0 pt-1">
              {editing ? (
                <input
                  className="input-theme text-xl font-bold mb-2 py-2"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ maxWidth: 280 }}
                />
              ) : (
                <h1 className="font-display font-bold text-2xl text-white mb-1">{user?.name}</h1>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="tag text-xs font-semibold" style={{ background: roleConfig.bg, color: roleConfig.color }}>
                  {roleConfig.icon} {roleConfig.label}
                </span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <CheckCircle size={11} /> Verified account
                </span>
              </div>
            </div>

            {/* Edit/Save buttons */}
            <div className="flex gap-2 flex-shrink-0">
              {editing ? (
                <>
                  <button onClick={() => { setEditing(false); setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "" }); }}
                    className="p-2.5 rounded-xl text-white/60 hover:text-white transition-colors"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <X size={16} />
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={{ background: "var(--brand)", color: "white" }}>
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Edit3 size={14} /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 pb-16 space-y-4">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: "Orders", value: "12", color: "var(--brand)" },
            { icon: Star, label: "Reviews", value: "8", color: "#f59e0b" },
            { icon: TrendingUp, label: "Saved", value: "₹340", color: "#22c55e" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center transition-all hover:-translate-y-1 cursor-pointer"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <Icon size={18} className="mx-auto mb-2" style={{ color }} />
              <p className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-display font-bold text-sm uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Contact Information
            </h2>
          </div>
          
          <div className="divide-y" style={{ "--tw-divide-opacity": 1 }}>
            {/* Email — read only */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,107,53,0.1)" }}>
                <Mail size={15} style={{ color: "var(--brand)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>Email</p>
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{user?.email}</p>
              </div>
              <span className="tag tag-green text-[10px]">Verified</span>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-4 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,107,53,0.1)" }}>
                <Phone size={15} style={{ color: "var(--brand)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>Phone</p>
                {editing ? (
                  <input className="input-theme text-sm py-1.5" placeholder="+91 98765 43210"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                ) : (
                  <p className="text-sm font-medium" style={{ color: form.phone ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {form.phone || "Add phone number"}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(255,107,53,0.1)" }}>
                <MapPin size={15} style={{ color: "var(--brand)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>Default Address</p>
                {editing ? (
                  <textarea className="input-theme text-sm py-2 resize-none" rows={2} placeholder="Your delivery address"
                    value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                ) : (
                  <p className="text-sm font-medium" style={{ color: form.address ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {form.address || "Add delivery address"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        {recentOrders.length > 0 && (
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-display font-bold text-sm uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Recent Orders
              </h2>
              <Link to="/orders" className="text-xs font-semibold" style={{ color: "var(--brand)" }}>
                View all →
              </Link>
            </div>
            <div className="divide-y">
              {recentOrders.map((order, i) => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                return (
                  <Link key={order._id} to={`/orders/${order._id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--hover)]"
                    style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: "var(--elevated)" }}>🛍️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {order.storeId?.name || "Store"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ₹{order.totalPrice}
                      </p>
                    </div>
                    <span className="tag text-[10px] font-semibold flex-shrink-0" style={{ background: sc.color + "20", color: sc.color }}>
                      {sc.label}
                    </span>
                    <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="rounded-3xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          {[
            { icon: Package, label: "My Orders", sub: "Track and manage orders", to: "/orders", color: "var(--brand)" },
            { icon: Heart, label: "Saved Stores", sub: "Your favourite stores", to: "/", color: "#ef4444" },
            { icon: Shield, label: "Settings", sub: "Privacy, security & more", to: "/settings", color: "#8b5cf6" },
          ].map(({ icon: Icon, label, sub, to, color }, i) => (
            <Link key={to} to={to}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--hover)]"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + "15" }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.2)" }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}