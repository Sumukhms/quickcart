/**
 * StoreCoupons.jsx
 *
 * Store owners can create, toggle, and delete coupons that apply
 * specifically when customers order from their store.
 *
 * Route: /store/coupons
 */
import { useState, useEffect, useCallback } from "react";
import { Link }                              from "react-router-dom";
import {
  ChevronLeft, Plus, Trash2, ToggleLeft, ToggleRight,
  Tag, X, Check, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { storeCouponAPI } from "../../api/api";
import { useCart }        from "../../context/CartContext";
import { EmptyState }     from "../../components/ui/Skeleton";

const DISCOUNT_TYPES = [
  { id: "percent",       label: "Percentage %",  eg: "e.g. 15% off" },
  { id: "flat",          label: "Flat Amount ₹", eg: "e.g. ₹50 off" },
  { id: "free_delivery", label: "Free Delivery",  eg: "Waive delivery fee" },
];

function CouponForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    code:           "",
    description:    "",
    discountType:   "percent",
    discountValue:  10,
    minOrderAmount: 0,
    maxDiscount:    "",
    usageLimit:     "",
    expiresAt:      "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const { addToast } = useCart();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) { setError("Coupon code is required"); return; }
    setSaving(true);
    setError("");
    try {
      const { data } = await storeCouponAPI.create({
        ...form,
        code:           form.code.trim().toUpperCase(),
        discountValue:  Number(form.discountValue) || 0,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount:    form.maxDiscount  ? Number(form.maxDiscount)  : null,
        usageLimit:     form.usageLimit   ? Number(form.usageLimit)   : null,
        expiresAt:      form.expiresAt    ? new Date(form.expiresAt)  : null,
      });
      addToast("Coupon created! 🎉", "success");
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create coupon");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.1)" }}>
              <Tag size={16} style={{ color: "var(--brand)" }} />
            </div>
            <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>New Store Coupon</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
            <X size={15} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          {/* Code */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
              Coupon Code *
            </label>
            <input className="input-theme text-sm uppercase" required placeholder="e.g. SAVE20, WELCOME10"
              value={form.code} onChange={e => set("code", e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
              Description (shown to customers)
            </label>
            <input className="input-theme text-sm" placeholder="e.g. 20% off on orders above ₹200"
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Discount Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>
              Discount Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DISCOUNT_TYPES.map(({ id, label, eg }) => (
                <button key={id} type="button" onClick={() => set("discountType", id)}
                  className="py-2.5 px-2 rounded-xl text-xs font-semibold text-center transition-all hover:scale-[1.02]"
                  style={{
                    background: form.discountType === id ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                    color:      form.discountType === id ? "var(--brand)"          : "var(--text-secondary)",
                    border: `1.5px solid ${form.discountType === id ? "var(--brand)" : "var(--border)"}`,
                  }}>
                  <div className="font-bold">{label}</div>
                  <div className="text-[9px] mt-0.5 opacity-70">{eg}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Value + Min order */}
          <div className="grid grid-cols-2 gap-3">
            {form.discountType !== "free_delivery" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
                  {form.discountType === "percent" ? "Discount %" : "Amount ₹"}
                </label>
                <input type="number" className="input-theme text-sm" min="0"
                  placeholder={form.discountType === "percent" ? "10" : "50"}
                  value={form.discountValue} onChange={e => set("discountValue", e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
                Min Order ₹
              </label>
              <input type="number" className="input-theme text-sm" min="0" placeholder="0"
                value={form.minOrderAmount} onChange={e => set("minOrderAmount", e.target.value)} />
            </div>
          </div>

          {/* Max discount cap (percent only) + Usage limit */}
          <div className="grid grid-cols-2 gap-3">
            {form.discountType === "percent" && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
                  Max Discount ₹
                </label>
                <input type="number" className="input-theme text-sm" min="0" placeholder="No cap"
                  value={form.maxDiscount} onChange={e => set("maxDiscount", e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
                Usage Limit
              </label>
              <input type="number" className="input-theme text-sm" min="1" placeholder="Unlimited"
                value={form.usageLimit} onChange={e => set("usageLimit", e.target.value)} />
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>
              Expiry Date (optional)
            </label>
            <input type="datetime-local" className="input-theme text-sm"
              value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center py-2.5 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-brand flex-1 justify-center py-2.5 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Create Coupon</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoreCoupons() {
  const { addToast } = useCart();
  const [coupons,    setCoupons]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [error,      setError]      = useState("");

  const fetchCoupons = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const { data } = await storeCouponAPI.list();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load coupons");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleToggle = async (id) => {
    try {
      const { data } = await storeCouponAPI.toggle(id);
      setCoupons(prev => prev.map(c => c._id === id ? data : c));
    } catch { addToast("Failed to update coupon", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon? This cannot be undone.")) return;
    try {
      await storeCouponAPI.delete(id);
      setCoupons(prev => prev.filter(c => c._id !== id));
      addToast("Coupon deleted", "info");
    } catch { addToast("Failed to delete coupon", "error"); }
  };

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/store/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Store Coupons</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {coupons.length} coupon{coupons.length !== 1 ? "s" : ""} · Exclusive to your store
            </p>
          </div>
          <button onClick={() => fetchCoupons(true)} className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-brand text-sm">
            <Plus size={14} /> New Coupon
          </button>
        </div>

        {/* Info banner */}
        <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
          <Tag size={16} style={{ color: "#3b82f6", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="font-bold text-sm" style={{ color: "#3b82f6" }}>Store-exclusive coupons</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              These coupons only work when customers order from your store. Customers can apply them at checkout.
              Platform-wide coupons are managed by admin separately.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error} <button onClick={() => fetchCoupons()} className="ml-2 underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl h-20 shimmer" style={{ backgroundColor: "var(--card)" }} />
            ))}
          </div>
        ) : coupons.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="No coupons yet"
            subtitle="Create your first store coupon to attract customers with exclusive discounts"
            action={
              <button onClick={() => setShowForm(true)} className="btn btn-brand text-sm">
                <Plus size={14} /> Create First Coupon
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {coupons.map(coupon => (
              <div key={coupon._id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  opacity: coupon.isActive ? 1 : 0.6,
                }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold font-mono text-sm" style={{ color: "var(--brand)" }}>{coupon.code}</p>
                    <span className="tag text-[10px]"
                      style={{
                        background: coupon.isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                        color:      coupon.isActive ? "#22c55e"               : "#ef4444",
                      }}>
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="tag text-[10px]" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                      {coupon.discountType === "percent"       ? `${coupon.discountValue}% off` :
                       coupon.discountType === "flat"          ? `₹${coupon.discountValue} off` :
                       "Free delivery"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {coupon.description || "No description"} ·
                    Used {coupon.usedCount}/{coupon.usageLimit ?? "∞"} ·
                    Min order ₹{coupon.minOrderAmount}
                    {coupon.expiresAt && ` · Expires ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleToggle(coupon._id)}
                    className="p-2 rounded-xl transition-all hover:scale-110"
                    style={{
                      background: coupon.isActive ? "rgba(34,197,94,0.1)" : "var(--elevated)",
                      color:      coupon.isActive ? "#22c55e"               : "var(--text-muted)",
                    }}>
                    {coupon.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  </button>
                  <button onClick={() => handleDelete(coupon._id)}
                    className="p-2 rounded-xl transition-all hover:scale-110"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <CouponForm
          onSave={(coupon) => { setCoupons(prev => [coupon, ...prev]); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}