import { useState, useEffect, useCallback } from "react";
import { Users, Package, Tag, TrendingUp, RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight, X, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { adminAPI } from "../../api/api";
import { useCart } from "../../context/CartContext";

const TABS = [
  { id: "overview", label: "Overview",  icon: TrendingUp },
  { id: "users",    label: "Users",     icon: Users },
  { id: "orders",   label: "Orders",    icon: Package },
  { id: "coupons",  label: "Coupons",   icon: Tag },
];

const STATUS_COLORS = {
  pending:          "#f59e0b", confirmed: "#3b82f6", preparing: "#8b5cf6",
  packing:          "#06b6d4", ready_for_pickup: "#f97316",
  out_for_delivery: "#ff6b35", delivered: "#22c55e", cancelled: "#ef4444",
};

const ROLE_COLORS = { customer: "#22c55e", store: "#3b82f6", delivery: "#f59e0b", admin: "#8b5cf6" };

// ── Coupon form ────────────────────────────────────────────────
function CouponForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    code: "", description: "", discountType: "percent",
    discountValue: 10, minOrderAmount: 0, maxDiscount: null,
    usageLimit: null, expiresAt: "", applicableCategories: [],
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createCoupon({
        ...form,
        code:           form.code.toUpperCase(),
        discountValue:  Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscount:    form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit:     form.usageLimit  ? Number(form.usageLimit)  : null,
        expiresAt:      form.expiresAt   ? new Date(form.expiresAt) : null,
      });
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create coupon");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>New Coupon</h3>
          <button onClick={onClose} className="p-2 rounded-xl" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Code *</label>
              <input className="input-theme text-sm uppercase" required value={form.code} onChange={e => set("code", e.target.value)} placeholder="SAVE20" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Type</label>
              <select className="input-theme text-sm" value={form.discountType} onChange={e => set("discountType", e.target.value)}>
                <option value="percent">Percent %</option>
                <option value="flat">Flat ₹</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Description</label>
            <input className="input-theme text-sm" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Short description for customers" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Value</label>
              <input type="number" className="input-theme text-sm" min="0" value={form.discountValue} onChange={e => set("discountValue", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Min order ₹</label>
              <input type="number" className="input-theme text-sm" min="0" value={form.minOrderAmount} onChange={e => set("minOrderAmount", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Max uses</label>
              <input type="number" className="input-theme text-sm" min="1" placeholder="∞" value={form.usageLimit || ""} onChange={e => set("usageLimit", e.target.value || null)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Expires</label>
            <input type="datetime-local" className="input-theme text-sm" value={form.expiresAt} onChange={e => set("expiresAt", e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center py-2.5 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-brand flex-1 justify-center py-2.5 text-sm">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Create</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────
export default function AdminPanel() {
  const { addToast } = useCart();
  const [tab,        setTab]        = useState("overview");
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [coupons,    setCoupons]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [userRole,   setUserRole]   = useState("");
  const [orderStatus,setOrderStatus]= useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const load = useCallback(async (which) => {
    setLoading(true);
    try {
      if (which === "overview" || which === "all") {
        const { data } = await adminAPI.getStats();
        setStats(data);
      }
      if (which === "users" || which === "all") {
        const { data } = await adminAPI.getUsers({ role: userRole || undefined, limit: 100 });
        setUsers(data.users);
      }
      if (which === "orders" || which === "all") {
        const { data } = await adminAPI.getOrders({ status: orderStatus || undefined, limit: 100 });
        setOrders(data.orders);
      }
      if (which === "coupons" || which === "all") {
        const { data } = await adminAPI.getCoupons();
        setCoupons(data);
      }
    } catch (e) {
      addToast(e.response?.data?.message || "Failed to load data", "error");
    } finally { setLoading(false); }
  }, [userRole, orderStatus, addToast]);

  useEffect(() => { load(tab); }, [tab]);
  useEffect(() => { if (tab === "users")  load("users");  }, [userRole]);
  useEffect(() => { if (tab === "orders") load("orders"); }, [orderStatus]);

  const deleteCoupon = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await adminAPI.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c._id !== id));
      addToast("Coupon deleted", "info");
    } catch { addToast("Failed to delete", "error"); }
  };

  const toggleCoupon = async (id) => {
    try {
      const { data } = await adminAPI.toggleCoupon(id);
      setCoupons(prev => prev.map(c => c._id === id ? data : c));
    } catch { addToast("Failed to update coupon", "error"); }
  };

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Admin Panel</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>System management</p>
          </div>
          <button onClick={() => load(tab)} className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all"
              style={{
                background: tab === id ? "var(--brand)" : "var(--elevated)",
                color:      tab === id ? "white"         : "var(--text-secondary)",
              }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && stats && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total users",   value: stats.users,              color: "#22c55e" },
                { label: "Total orders",  value: stats.orders,             color: "var(--brand)" },
                { label: "Total stores",  value: stats.stores,             color: "#3b82f6" },
                { label: "Total revenue", value: `₹${stats.revenue.toLocaleString()}`, color: "#8b5cf6" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl p-5"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="font-display font-black text-2xl" style={{ color }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["", "customer", "store", "delivery", "admin"].map(r => (
                <button key={r} onClick={() => setUserRole(r)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: userRole === r ? "var(--brand)" : "var(--elevated)",
                    color:      userRole === r ? "white"         : "var(--text-muted)",
                  }}>
                  {r || "All"} {r && `(${users.filter(u => u.role === r).length})`}
                </button>
              ))}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {loading ? (
                <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading...</div>
              ) : users.map((u, i) => (
                <div key={u._id} className="flex items-center gap-4 px-5 py-3"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", backgroundColor: "var(--card)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, var(--brand), #ff8c5a)` }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{u.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                    style={{ background: (ROLE_COLORS[u.role] || "#888") + "18", color: ROLE_COLORS[u.role] || "#888" }}>
                    {u.role}
                  </span>
                  <p className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["", "pending", "out_for_delivery", "delivered", "cancelled"].map(s => (
                <button key={s} onClick={() => setOrderStatus(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: orderStatus === s ? "var(--brand)" : "var(--elevated)",
                    color:      orderStatus === s ? "white"         : "var(--text-muted)",
                  }}>
                  {s || "All"}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="p-8 text-center rounded-2xl" style={{ background: "var(--card)", color: "var(--text-muted)" }}>Loading...</div>
              ) : orders.map(order => (
                <div key={order._id} className="rounded-2xl overflow-hidden"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                          {order.userId?.name || "Unknown"}
                        </p>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>→ {order.storeId?.name}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded"
                          style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                          #{order._id?.slice(-6)}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-bold text-sm" style={{ color: "var(--brand)" }}>₹{order.totalPrice}</span>
                      <span className="tag text-[10px] font-semibold"
                        style={{ background: (STATUS_COLORS[order.status] || "#888") + "18", color: STATUS_COLORS[order.status] || "#888" }}>
                        {order.status}
                      </span>
                      {expandedOrder === order._id ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
                    </div>
                  </div>
                  {expandedOrder === order._id && (
                    <div className="px-5 pb-4 pt-2 space-y-1 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      <p>📍 {order.deliveryAddress}</p>
                      <p>📦 {order.items?.map(i => `${i.name}×${i.quantity}`).join(", ")}</p>
                      <p>💳 {order.paymentMethod?.toUpperCase()}</p>
                      <p>📧 {order.userId?.email}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Coupons ── */}
        {tab === "coupons" && (
          <div>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowForm(true)} className="btn btn-brand text-sm">
                <Plus size={14} /> New Coupon
              </button>
            </div>
            <div className="space-y-2">
              {coupons.map(coupon => (
                <div key={coupon._id} className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", opacity: coupon.isActive ? 1 : 0.6 }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold font-mono text-sm" style={{ color: "var(--brand)" }}>{coupon.code}</p>
                      <span className="tag text-[10px]" style={{ background: coupon.isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)", color: coupon.isActive ? "#22c55e" : "#ef4444" }}>
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="tag text-[10px]" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                        {coupon.discountType === "percent"       ? `${coupon.discountValue}% off` :
                         coupon.discountType === "flat"          ? `₹${coupon.discountValue} off` :
                         "Free delivery"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {coupon.description} · Used {coupon.usedCount}/{coupon.usageLimit ?? "∞"} · Min ₹{coupon.minOrderAmount}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleCoupon(coupon._id)}
                      className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ background: coupon.isActive ? "rgba(34,197,94,0.1)" : "var(--elevated)", color: coupon.isActive ? "#22c55e" : "var(--text-muted)" }}>
                      {coupon.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                    </button>
                    <button onClick={() => deleteCoupon(coupon._id)}
                      className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {!loading && coupons.length === 0 && (
                <div className="text-center py-16 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="text-5xl mb-3">🏷️</div>
                  <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No coupons yet</p>
                </div>
              )}
            </div>
            {showForm && <CouponForm onSave={() => { setShowForm(false); load("coupons"); addToast("Coupon created!", "success"); }} onClose={() => setShowForm(false)} />}
          </div>
        )}
      </div>
    </div>
  );
}