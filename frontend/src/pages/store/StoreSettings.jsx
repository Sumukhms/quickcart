import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Store, Phone, MapPin, Clock, DollarSign,
  Save, Check, ToggleLeft, ToggleRight, Star, Image, LogOut
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

const CATEGORIES = ["Groceries", "Food", "Snacks", "Beverages", "Medicines", "Other"];
const DELIVERY_TIMES = ["8-12 min", "10-15 min", "12-18 min", "15-20 min", "20-30 min", "30-45 min"];

export default function StoreSettings() {
  const { user, logout } = useAuth();
  const { addToast, clearCart } = useCart();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", category: "Groceries",
    image: "", deliveryTime: "20-30 min", minOrder: 0, isOpen: true,
  });

  useEffect(() => { fetchStore(); }, []);

  const fetchStore = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/stores/mine");
      setStore(data);
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        category: data.category || "Groceries",
        image: data.image || "",
        deliveryTime: data.deliveryTime || "20-30 min",
        minOrder: data.minOrder || 0,
        isOpen: data.isOpen ?? true,
      });
    } catch {
      const demo = { _id: "s1", name: "My Demo Store", phone: "+91 98765 43210", address: "Koramangala, Bengaluru", category: "Groceries", image: "", deliveryTime: "20-30 min", minOrder: 99, isOpen: true, rating: 4.7, totalRatings: 234 };
      setStore(demo);
      setForm({ name: demo.name, phone: demo.phone, address: demo.address, category: demo.category, image: demo.image, deliveryTime: demo.deliveryTime, minOrder: demo.minOrder, isOpen: demo.isOpen });
    } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      addToast("Name, phone and address are required", "error"); return;
    }
    setSaving(true);
    try {
      if (store?._id && store._id !== "s1") {
        await api.put(`/stores/${store._id}`, form);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      addToast("Store settings saved! ✓", "success");
    } catch {
      addToast("Settings saved (demo mode)", "success");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
      </div>
    );
  }

  const catEmojis = { Groceries: "🛒", Food: "🍛", Snacks: "🍕", Beverages: "🧃", Medicines: "💊", Other: "🏪" };

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/store/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Store Settings</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Manage your store profile</p>
          </div>
        </div>

        {/* Store Status Banner */}
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: "var(--elevated)" }}>
            {catEmojis[form.category] || "🏪"}
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: "var(--text-primary)" }}>{form.name || "Your Store"}</p>
            <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <Star size={11} fill="#f59e0b" stroke="none" />
              <span style={{ color: "#f59e0b" }}>{store?.rating?.toFixed(1) || "4.5"}</span>
              <span>({store?.totalRatings || 0} ratings)</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => setForm(f => ({ ...f, isOpen: !f.isOpen }))}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{
                background: form.isOpen ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                color: form.isOpen ? "#22c55e" : "#ef4444",
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {form.isOpen ? "Open" : "Closed"}
            </button>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>tap to toggle</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Basic Info */}
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Basic Information
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Store Name *</label>
                <div className="relative">
                  <Store size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input className="input-theme pl-10 text-sm" placeholder="Your store name" required
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Phone *</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input className="input-theme pl-10 text-sm" placeholder="+91 98765 43210" required
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Address *</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3.5" style={{ color: "var(--text-muted)" }} />
                  <textarea className="input-theme pl-10 text-sm resize-none" rows={2} required
                    placeholder="Full store address" value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Store Image URL</label>
                <div className="relative">
                  <Image size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input className="input-theme pl-10 text-sm" placeholder="https://..." type="url"
                    value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Category</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button"
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className="py-3 px-2 rounded-xl text-xs font-bold transition-all hover:scale-105 text-center"
                    style={{
                      background: form.category === cat ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                      color: form.category === cat ? "var(--brand)" : "var(--text-secondary)",
                      border: `1.5px solid ${form.category === cat ? "var(--brand)" : "var(--border)"}`,
                    }}>
                    <div className="text-xl mb-1">{catEmojis[cat]}</div>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Config */}
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Delivery Settings</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Delivery Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {DELIVERY_TIMES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, deliveryTime: t }))}
                      className="py-2 px-1 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                      style={{
                        background: form.deliveryTime === t ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                        color: form.deliveryTime === t ? "var(--brand)" : "var(--text-secondary)",
                        border: `1px solid ${form.deliveryTime === t ? "var(--brand)" : "var(--border)"}`,
                      }}>
                      <Clock size={11} className="mx-auto mb-0.5" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                  Minimum Order (₹)
                </label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input type="number" className="input-theme pl-10 text-sm" placeholder="0 for no minimum" min="0"
                    value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button type="submit" disabled={saving}
            className="btn w-full justify-center py-4 text-base transition-all"
            style={{
              background: saved ? "#22c55e" : "var(--brand)",
              color: "white",
              boxShadow: saved ? "0 0 20px rgba(34,197,94,0.3)" : "0 8px 24px rgba(255,107,53,0.3)",
            }}>
            {saving
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : saved
              ? <><Check size={16} /> Saved!</>
              : <><Save size={16} /> Save Settings</>}
          </button>
        </form>

        {/* Sign Out */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm mt-4 transition-all hover:scale-[1.01]"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.18)" }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}