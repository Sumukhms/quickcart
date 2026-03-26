import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell, Moon, Sun, Shield, Lock, Eye, EyeOff, Trash2, ChevronLeft,
  Smartphone, Mail, Globe, Zap, Save, Check, AlertTriangle, LogOut, User
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className="relative flex-shrink-0 transition-all duration-300 hover:scale-105"
    style={{
      width: 44, height: 24,
      borderRadius: 12,
      background: checked ? "var(--brand)" : "var(--border)",
    }}
  >
    <div className="absolute top-1 transition-all duration-300"
      style={{
        width: 16, height: 16,
        background: "white",
        borderRadius: "50%",
        left: checked ? "calc(100% - 20px)" : 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
  </button>
);

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)" }}>
          <Icon size={15} style={{ color: "var(--brand)" }} />
        </div>
        <h2 className="font-display font-bold text-sm uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingRow({ label, sub, right, borderTop = true }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4"
      style={{ borderTop: borderTop ? "1px solid var(--border)" : "none" }}>
      <div className="min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
      <div className="flex-shrink-0">{right}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { isDark, toggleTheme, theme, setTheme } = useTheme();
  const { user, logout, isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newStores: false,
    emailDigest: true,
    smsAlerts: false,
    pushNotifs: true,
  });

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    analytics: false,
    personalisedAds: false,
  });

  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwVisible, setPwVisible] = useState({ current: false, newPw: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const toggleNotif = (key) => setNotifications(p => ({ ...p, [key]: !p[key] }));
  const togglePrivacy = (key) => setPrivacy(p => ({ ...p, [key]: !p[key] }));

  const handleSaveNotifs = () => {
    setSaved(true);
    addToast("Notification preferences saved!", "success");
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      addToast("Passwords don't match", "error"); return;
    }
    if (pwForm.newPw.length < 6) {
      addToast("Password must be at least 6 characters", "error"); return;
    }
    setPwLoading(true);
    try {
      // In a real app, you'd have a change-password endpoint
      await new Promise(r => setTimeout(r, 1000)); // simulate
      addToast("Password updated successfully!", "success");
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch {
      addToast("Failed to update password", "error");
    } finally { setPwLoading(false); }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="font-bold text-xl mb-4" style={{ color: "var(--text-primary)" }}>Sign in to access settings</h2>
          <Link to="/login" className="btn btn-brand">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile"
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Settings</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage your preferences</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Appearance */}
          <SectionCard title="Appearance" icon={isDark ? Moon : Sun}>
            <SettingRow
              borderTop={false}
              label="Dark Mode"
              sub="Easy on the eyes at night"
              right={<Toggle checked={isDark} onChange={toggleTheme} />}
            />
            <div className="px-5 pb-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Theme</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "dark", label: "Dark", preview: "#070708" },
                  { id: "light", label: "Light", preview: "#f8f7f5" },
                  { id: "system", label: "System", preview: "linear-gradient(135deg, #070708 50%, #f8f7f5 50%)" },
                ].map(({ id, label, preview }) => (
                  <button key={id} onClick={() => id !== "system" && setTheme(id)}
                    className="relative py-3 px-2 rounded-2xl text-xs font-bold transition-all hover:scale-105"
                    style={{
                      background: theme === id ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                      border: `2px solid ${theme === id ? "var(--brand)" : "var(--border)"}`,
                      color: theme === id ? "var(--brand)" : "var(--text-secondary)",
                    }}>
                    <div className="w-8 h-5 rounded-md mx-auto mb-1.5"
                      style={{ background: preview, border: "1px solid var(--border)" }} />
                    {label}
                    {theme === id && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "var(--brand)" }}>
                        <Check size={9} color="white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications" icon={Bell}>
            {[
              { key: "orderUpdates", label: "Order Updates", sub: "Track status changes in real-time", icon: Zap },
              { key: "promotions", label: "Promotions & Deals", sub: "Exclusive offers and discounts", icon: Bell },
              { key: "newStores", label: "New Stores Nearby", sub: "When a new store opens near you", icon: Globe },
              { key: "emailDigest", label: "Email Digest", sub: "Weekly summary of your activity", icon: Mail },
              { key: "smsAlerts", label: "SMS Alerts", sub: "Critical order updates via SMS", icon: Smartphone },
            ].map(({ key, label, sub, icon: Icon }, i) => (
              <SettingRow
                key={key}
                borderTop={i > 0}
                label={label}
                sub={sub}
                right={<Toggle checked={notifications[key]} onChange={() => toggleNotif(key)} />}
              />
            ))}
            <div className="px-5 pb-4 pt-2">
              <button onClick={handleSaveNotifs}
                className="btn btn-brand text-sm py-2.5 px-5 transition-all"
                style={saved ? { background: "#22c55e" } : {}}>
                {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Preferences</>}
              </button>
            </div>
          </SectionCard>

          {/* Privacy */}
          <SectionCard title="Privacy" icon={Eye}>
            {[
              { key: "shareLocation", label: "Location Services", sub: "Better store and delivery accuracy" },
              { key: "analytics", label: "Usage Analytics", sub: "Help improve QuickCart experience" },
              { key: "personalisedAds", label: "Personalised Ads", sub: "See relevant offers and content" },
            ].map(({ key, label, sub }, i) => (
              <SettingRow
                key={key}
                borderTop={i > 0}
                label={label}
                sub={sub}
                right={<Toggle checked={privacy[key]} onChange={() => togglePrivacy(key)} />}
              />
            ))}
          </SectionCard>

          {/* Security / Change Password */}
          <SectionCard title="Security" icon={Lock}>
            <form onSubmit={handlePasswordChange} className="px-5 py-4 space-y-3">
              {[
                { key: "current", label: "Current Password", placeholder: "Enter current password" },
                { key: "newPw", label: "New Password", placeholder: "Min. 6 characters" },
                { key: "confirm", label: "Confirm New Password", placeholder: "Repeat new password" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--text-muted)" }}>{label}</label>
                  <div className="relative">
                    <input
                      type={pwVisible[key] ? "text" : "password"}
                      className="input-theme pr-10 text-sm"
                      placeholder={placeholder}
                      value={pwForm[key]}
                      onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                    />
                    <button type="button" onClick={() => setPwVisible(p => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100 opacity-50">
                      {pwVisible[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" disabled={pwLoading}
                className="btn btn-brand text-sm py-2.5 w-full justify-center mt-1">
                {pwLoading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Lock size={14} /> Update Password</>}
              </button>
            </form>
          </SectionCard>

          {/* Account */}
          <SectionCard title="Account" icon={User}>
            <SettingRow
              borderTop={false}
              label="Signed in as"
              sub={user?.email}
              right={
                <span className="tag tag-green text-[10px]">Active</span>
              }
            />
            <div className="px-5 pb-4 flex flex-col gap-2">
              <button
                onClick={() => { logout(); navigate("/"); addToast("Signed out", "info"); }}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <LogOut size={15} /> Sign Out
              </button>

              {!deleteConfirm ? (
                <button onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                  style={{ background: "rgba(239,68,68,0.04)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                  <Trash2 size={15} /> Delete Account
                </button>
              ) : (
                <div className="p-4 rounded-2xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle size={16} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      This will permanently delete your account and all data. This action cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setDeleteConfirm(false); addToast("Account deletion cancelled", "info"); }}
                      className="btn btn-ghost text-xs py-2 px-3">Cancel</button>
                    <button onClick={() => addToast("Please contact support to delete your account", "info")}
                      className="text-xs font-semibold py-2 px-3 rounded-xl"
                      style={{ background: "#ef4444", color: "white" }}>
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* App version */}
          <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
            QuickCart v1.0.0 · Made with ❤️ in India
          </p>
        </div>
      </div>
    </div>
  );
}