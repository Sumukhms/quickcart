/**
 * StoreSettings.jsx — UPDATED with Cloudinary logo upload
 *
 * Changes vs original:
 *   - Store image field replaced with <ImageUploader type="store" />
 *   - The uploader auto-saves the URL to DB when upload completes
 *   - Manual image URL field retained as fallback (hidden when uploader used)
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Store, Phone, MapPin, Clock, DollarSign,
  Save, Check, Star, LogOut, Plus, AlertCircle,
  FileText, RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";
import ImageUploader from "../../components/ui/ImageUploader.jsx";

const CATEGORIES    = ["Groceries", "Food", "Snacks", "Beverages", "Medicines", "Other"];
const DELIVERY_TIMES = ["8-12 min", "10-15 min", "12-18 min", "15-20 min", "20-30 min", "30-45 min"];

const CAT_EMOJIS = { Groceries:"🛒", Food:"🍛", Snacks:"🍕", Beverages:"🧃", Medicines:"💊", Other:"🏪" };
const CAT_DESCRIPTIONS = {
  Groceries: "Fruits, veggies, dairy, staples",
  Food:      "Restaurant meals, tiffin, home food",
  Snacks:    "Chips, biscuits, fast food",
  Beverages: "Juice, tea, coffee, cold drinks",
  Medicines: "OTC medicines, health products",
  Other:     "General merchandise",
};

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5"
      style={{ color: "var(--text-muted)" }}>
      {children}
    </label>
  );
}

function InputWithIcon({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-muted)" }} />
      <input className="input-theme pl-10 text-sm" {...props} />
    </div>
  );
}

export default function StoreSettings() {
  const { user, logout } = useAuth();
  const { addToast, clearCart } = useCart();
  const navigate = useNavigate();

  const [store,      setStore]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const [isNewStore, setIsNewStore] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", address: "", description: "",
    category: "Groceries", image: "",
    deliveryTime: "20-30 min", minOrder: 0, isOpen: true,
  });

  useEffect(() => { fetchStore(); }, []);

  const fetchStore = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await api.get("/stores/mine");
      setStore(data);
      setIsNewStore(false);
      setForm({
        name:         data.name         || "",
        phone:        data.phone        || "",
        address:      data.address      || "",
        description:  data.description  || "",
        category:     data.category     || "Groceries",
        image:        data.image        || "",
        deliveryTime: data.deliveryTime || "20-30 min",
        minOrder:     data.minOrder     || 0,
        isOpen:       data.isOpen       ?? true,
      });
    } catch (err) {
      if (err.response?.status === 404) { setIsNewStore(true); setStore(null); }
      else setError("Failed to load store. Check your connection.");
    } finally { setLoading(false); }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const validate = () => {
    if (!form.name.trim())    return "Store name is required";
    if (!form.phone.trim())   return "Phone number is required";
    if (!form.address.trim()) return "Address is required";
    if (!form.category)       return "Category is required";
    return null;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { addToast(validationError, "error"); return; }
    setSaving(true); setError("");
    try {
      let result;
      if (isNewStore) {
        const { data } = await api.post("/stores", form);
        result = data;
        setIsNewStore(false);
        addToast("Store created successfully! 🎉", "success");
      } else {
        const { data } = await api.put(`/stores/${store._id}`, form);
        result = data;
        addToast("Settings saved! ✓", "success");
      }
      setStore(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save. Please try again.";
      setError(msg);
      addToast(msg, "error");
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); clearCart(); navigate("/login"); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/store/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              {isNewStore ? "Create Your Store" : "Store Settings"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {isNewStore ? "Set up your store to start selling" : "Manage your store profile"}
            </p>
          </div>
          {!isNewStore && (
            <button onClick={fetchStore} className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        {isNewStore && (
          <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
            style={{ background: "rgba(59,130,246,0.08)", border: "1.5px solid rgba(59,130,246,0.25)" }}>
            <AlertCircle size={18} style={{ color: "#3b82f6", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "#3b82f6" }}>No store yet</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Fill in the details below to create your store.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-3.5 mb-4 text-sm font-medium"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* Store preview card */}
        {!isNewStore && store && (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-14 h-14 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center text-3xl"
              style={{ background: "var(--elevated)" }}>
              {form.image
                ? <img src={form.image} alt="logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                : CAT_EMOJIS[form.category] || "🏪"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate" style={{ color: "var(--text-primary)" }}>{form.name || "Your Store"}</p>
              <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {store.rating > 0 && <><Star size={11} fill="#f59e0b" stroke="none" /><span style={{ color: "#f59e0b" }}>{store.rating.toFixed(1)}</span></>}
                <span>{form.category}</span>
              </div>
            </div>
            <button type="button" onClick={() => set("isOpen", !form.isOpen)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{
                background: form.isOpen ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                color:      form.isOpen ? "#22c55e"               : "#ef4444",
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {form.isOpen ? "Open" : "Closed"}
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">

          {/* Basic Info */}
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}>
                <Store size={13} /> Basic Information
              </h2>
            </div>
            <div className="p-5 space-y-4">

              {/* ── UPDATED: Cloudinary logo uploader ── */}
              <div>
                <ImageUploader
                  type="store"
                  currentImage={form.image}
                  label="Store Logo / Banner"
                  shape="rect"
                  onUploaded={({ url }) => {
                    set("image", url);
                    addToast("Store logo uploaded! ✓", "success");
                  }}
                  onError={(msg) => addToast(msg, "error")}
                />
                {/* Fallback: manual URL entry */}
                {!form.image && (
                  <div className="mt-2">
                    <p className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>Or paste an image URL:</p>
                    <input
                      type="url"
                      className="input-theme text-xs py-2"
                      placeholder="https://example.com/store-image.jpg"
                      value={form.image}
                      onChange={e => set("image", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div>
                <FieldLabel>Store Name *</FieldLabel>
                <InputWithIcon icon={Store} placeholder="e.g. FreshMart Express"
                  required value={form.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone Number *</FieldLabel>
                <InputWithIcon icon={Phone} placeholder="+91 98765 43210"
                  required value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Store Address *</FieldLabel>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3.5 pointer-events-none"
                    style={{ color: "var(--text-muted)" }} />
                  <textarea className="input-theme pl-10 text-sm resize-none" rows={2} required
                    placeholder="Full address including area and city"
                    value={form.address} onChange={e => set("address", e.target.value)} />
                </div>
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <div className="relative">
                  <FileText size={15} className="absolute left-3.5 top-3.5 pointer-events-none"
                    style={{ color: "var(--text-muted)" }} />
                  <textarea className="input-theme pl-10 text-sm resize-none" rows={2}
                    placeholder="Tell customers what's special about your store..."
                    value={form.description} onChange={e => set("description", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Store Category *
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: form.category === cat ? "rgba(255,107,53,0.08)" : "var(--elevated)",
                      border: `1.5px solid ${form.category === cat ? "var(--brand)" : "var(--border)"}`,
                    }}>
                    <span className="text-2xl flex-shrink-0">{CAT_EMOJIS[cat]}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight"
                        style={{ color: form.category === cat ? "var(--brand)" : "var(--text-primary)" }}>
                        {cat}
                      </p>
                      <p className="text-[10px] mt-0.5 leading-tight truncate" style={{ color: "var(--text-muted)" }}>
                        {CAT_DESCRIPTIONS[cat]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          <div className="rounded-3xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="font-bold text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Delivery Settings
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <FieldLabel>Estimated Delivery Time</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {DELIVERY_TIMES.map(t => (
                    <button key={t} type="button" onClick={() => set("deliveryTime", t)}
                      className="py-2.5 px-1 rounded-xl text-xs font-semibold transition-all hover:scale-105 flex flex-col items-center gap-1"
                      style={{
                        background: form.deliveryTime === t ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                        color:      form.deliveryTime === t ? "var(--brand)"           : "var(--text-secondary)",
                        border: `1px solid ${form.deliveryTime === t ? "var(--brand)" : "var(--border)"}`,
                      }}>
                      <Clock size={11} /> {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel>Minimum Order Amount (₹)</FieldLabel>
                <InputWithIcon icon={DollarSign} type="number" placeholder="0 for no minimum" min="0"
                  value={form.minOrder} onChange={e => set("minOrder", Number(e.target.value))} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="btn w-full justify-center py-4 text-base font-bold transition-all"
            style={{
              background:  saved ? "#22c55e" : "var(--brand)",
              color:       "white",
              boxShadow:   saved ? "0 0 20px rgba(34,197,94,0.3)" : "0 8px 24px rgba(255,107,53,0.3)",
            }}>
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <><Check size={18} /> {isNewStore ? "Store Created!" : "Saved!"}</>
            ) : (
              <>{isNewStore ? <><Plus size={18} /> Create Store</> : <><Save size={18} /> Save Settings</>}</>
            )}
          </button>
        </form>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm mt-4 transition-all hover:scale-[1.01]"
          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.18)" }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}