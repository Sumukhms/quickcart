import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Package,
  Tag,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Image,
  Edit3,
  Eye,
  EyeOff,
  Wallet,
} from "lucide-react";
import { adminAPI } from "../../api/api";
import { useCart } from "../../context/CartContext";

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "users", label: "Users", icon: Users },
  { id: "orders", label: "Orders", icon: Package },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "banners", label: "Banners", icon: Image },
  { id: "payouts", label: "Payouts", icon: Wallet },
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  packing: "#06b6d4",
  ready_for_pickup: "#f97316",
  out_for_delivery: "#ff6b35",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};
const ROLE_COLORS = {
  customer: "#22c55e",
  store: "#3b82f6",
  delivery: "#f59e0b",
  admin: "#8b5cf6",
};

const BG_PRESETS = [
  { label: "Orange–Red", value: "from-orange-600 via-red-600 to-pink-700" },
  {
    label: "Purple–Violet",
    value: "from-purple-700 via-violet-600 to-indigo-700",
  },
  { label: "Teal–Green", value: "from-teal-600 via-emerald-600 to-green-700" },
  { label: "Blue–Cyan", value: "from-blue-600 via-cyan-500 to-sky-600" },
  { label: "Rose–Pink", value: "from-rose-600 via-pink-600 to-fuchsia-700" },
  { label: "Amber–Orange", value: "from-amber-500 via-orange-500 to-red-600" },
];

// ── Coupon Form ────────────────────────────────────────────────
function CouponForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: null,
    usageLimit: null,
    expiresAt: "",
    applicableCategories: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError("Coupon code is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminAPI.createCoupon({
        ...form,
        code: form.code.toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            New Platform Coupon
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{
              background: "var(--elevated)",
              color: "var(--text-muted)",
            }}
          >
            <X size={15} />
          </button>
        </div>
        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 max-h-[60vh] overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Code *
              </label>
              <input
                className="input-theme text-sm uppercase"
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Type
              </label>
              <select
                className="input-theme text-sm"
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              >
                <option value="percent">Percent %</option>
                <option value="flat">Flat ₹</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Description
            </label>
            <input
              className="input-theme text-sm"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description for customers"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Value
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="0"
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Min ₹
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Max uses
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="1"
                placeholder="∞"
                value={form.usageLimit || ""}
                onChange={(e) => set("usageLimit", e.target.value || null)}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Expires
            </label>
            <input
              type="datetime-local"
              className="input-theme text-sm"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 justify-center py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-brand flex-1 justify-center py-2.5 text-sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} /> Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Banner Form ────────────────────────────────────────────────
function BannerForm({ banner, onSave, onClose }) {
  const isEdit = !!banner;
  const [form, setForm] = useState({
    title: banner?.title || "",
    sub: banner?.sub || "",
    badge: banner?.badge || "",
    emoji: banner?.emoji || "🎁",
    cta: banner?.cta || "Order Now",
    bg: banner?.bg || BG_PRESETS[0].value,
    link: banner?.link || "/user/home",
    order: banner?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await adminAPI.updateBanner(banner._id, form);
      } else {
        await adminAPI.createBanner(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "var(--elevated)" }}
            >
              {form.emoji}
            </div>
            <h3
              className="font-bold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {isEdit ? "Edit Banner" : "New Banner"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{
              background: "var(--elevated)",
              color: "var(--text-muted)",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Live Preview */}
        <div
          className={`rounded-2xl p-5 mb-5 bg-gradient-to-br ${form.bg} relative overflow-hidden`}
        >
          <div className="relative z-10">
            {form.badge && (
              <span
                className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 text-white/90"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {form.badge}
              </span>
            )}
            <h3 className="font-bold text-xl text-white mb-1">
              {form.title || "Banner Title"}
            </h3>
            <p className="text-white/75 text-sm mb-3">
              {form.sub || "Sub-heading text"}
            </p>
            <span
              className="inline-block text-xs font-bold px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.9)", color: "#1a1a22" }}
            >
              {form.cta}
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-80">
            {form.emoji}
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-[1fr,80px] gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Title *
              </label>
              <input
                className="input-theme text-sm"
                required
                placeholder="First Order FREE"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Emoji
              </label>
              <input
                className="input-theme text-sm text-center"
                placeholder="🎁"
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                maxLength={4}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Sub-heading
            </label>
            <input
              className="input-theme text-sm"
              placeholder="Use code QUICKFIRST at checkout"
              value={form.sub}
              onChange={(e) => set("sub", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Badge chip
              </label>
              <input
                className="input-theme text-sm"
                placeholder="🎁 New user offer"
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                CTA Button
              </label>
              <input
                className="input-theme text-sm"
                placeholder="Order Now"
                value={form.cta}
                onChange={(e) => set("cta", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Link URL
              </label>
              <input
                className="input-theme text-sm"
                placeholder="/user/home"
                value={form.link}
                onChange={(e) => set("link", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Display Order
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="0"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-muted)" }}
            >
              Background Gradient
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BG_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("bg", value)}
                  className={`h-10 rounded-xl bg-gradient-to-br ${value} relative transition-all`}
                  style={{
                    border:
                      form.bg === value
                        ? "2px solid var(--brand)"
                        : "2px solid transparent",
                  }}
                >
                  {form.bg === value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={14} style={{ color: "white" }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 justify-center py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-brand flex-1 justify-center py-2.5 text-sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} />{" "}
                  {isEdit ? "Save Changes" : "Create Banner"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Admin Panel ───────────────────────────────────────────
export default function AdminPanel() {
  const { addToast } = useCart();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [payoutFilter, setPayoutFilter] = useState("pending");
  const [processingId, setProcessingId] = useState(null);

  const load = useCallback(
    async (which) => {
      setLoading(true);
      try {
        if (which === "overview" || which === "all") {
          const { data } = await adminAPI.getStats();
          setStats(data);
        }
        if (which === "users" || which === "all") {
          const { data } = await adminAPI.getUsers({
            role: userRole || undefined,
            limit: 100,
          });
          setUsers(data.users || []);
        }
        if (which === "orders" || which === "all") {
          const { data } = await adminAPI.getOrders({
            status: orderStatus || undefined,
            limit: 100,
          });
          setOrders(data.orders || []);
        }
        if (which === "coupons" || which === "all") {
          const { data } = await adminAPI.getCoupons();
          setCoupons(Array.isArray(data) ? data : []);
        }
        if (which === "banners" || which === "all") {
          const { data } = await adminAPI.getBanners();
          setBanners(Array.isArray(data) ? data : []);
        }
        if (which === "payouts" || which === "all") {
          const { data } = await adminAPI.getPayouts({ status: payoutFilter });
          setPayouts(data.requests || []);
        }
      } catch (e) {
        addToast(e.response?.data?.message || "Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    },
    [userRole, orderStatus, addToast],
  );

  const handlePayout = async (id, action) => {
    const note =
      action === "rejected"
        ? (window.prompt("Optional: add a rejection note (or leave blank)") ??
          "")
        : "";
    if (action === "rejected" && note === null) return; // user cancelled prompt
    setProcessingId(id);
    try {
      await adminAPI.processPayout(id, action, note);
      setPayouts((prev) =>
        prev.map((p) =>
          p._id === id
            ? {
                ...p,
                status: action,
                processedAt: new Date().toISOString(),
                note,
              }
            : p,
        ),
      );
      addToast(
        `Payout ${action} successfully`,
        action === "approved" ? "success" : "info",
      );
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to process payout",
        "error",
      );
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);
  useEffect(() => {
    if (tab === "users") load("users");
  }, [userRole]);
  useEffect(() => {
    if (tab === "orders") load("orders");
  }, [orderStatus]);
  useEffect(() => {
    if (tab === "payouts") load("payouts");
  }, [payoutFilter]);

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await adminAPI.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      addToast("Coupon deleted", "info");
    } catch {
      addToast("Failed to delete coupon", "error");
    }
  };

  const toggleCoupon = async (id) => {
    try {
      const { data } = await adminAPI.toggleCoupon(id);
      setCoupons((prev) => prev.map((c) => (c._id === id ? data : c)));
    } catch {
      addToast("Failed to update coupon", "error");
    }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await adminAPI.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b._id !== id));
      addToast("Banner deleted", "info");
    } catch {
      addToast("Failed to delete banner", "error");
    }
  };

  const toggleBanner = async (id) => {
    try {
      const { data } = await adminAPI.toggleBanner(id);
      setBanners((prev) => prev.map((b) => (b._id === id ? data : b)));
    } catch {
      addToast("Failed to update banner", "error");
    }
  };

  return (
    <div
      className="min-h-screen page-enter"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="font-display font-bold text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              Admin Panel
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Platform management
            </p>
          </div>
          <button
            onClick={() => load(tab)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold flex-shrink-0 transition-all"
              style={{
                background: tab === id ? "var(--brand)" : "var(--elevated)",
                color: tab === id ? "white" : "var(--text-secondary)",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-5">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-24 shimmer"
                    style={{ backgroundColor: "var(--card)" }}
                  />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: "Total users",
                    value: stats.users,
                    color: "#22c55e",
                  },
                  {
                    label: "Total orders",
                    value: stats.orders,
                    color: "var(--brand)",
                  },
                  {
                    label: "Total stores",
                    value: stats.stores,
                    color: "#3b82f6",
                  },
                  {
                    label: "Total revenue",
                    value: `₹${(stats.revenue || 0).toLocaleString()}`,
                    color: "#8b5cf6",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-5 transition-all hover:-translate-y-1"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <p
                      className="font-display font-black text-2xl"
                      style={{ color }}
                    >
                      {value}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["", "customer", "store", "delivery", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background:
                      userRole === r ? "var(--brand)" : "var(--elevated)",
                    color: userRole === r ? "white" : "var(--text-muted)",
                  }}
                >
                  {r || "All"}{" "}
                  {r && `(${users.filter((u) => u.role === r).length})`}
                </button>
              ))}
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              {loading ? (
                <div
                  className="p-8 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : users.length === 0 ? (
                <div
                  className="p-8 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  No users found
                </div>
              ) : (
                users.map((u, i) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-4 px-5 py-3"
                    style={{
                      borderTop: i > 0 ? "1px solid var(--border)" : "none",
                      backgroundColor: "var(--card)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--brand), #ff8c5a)",
                      }}
                    >
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-sm truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {u.name}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {u.email}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                      style={{
                        background: (ROLE_COLORS[u.role] || "#888") + "18",
                        color: ROLE_COLORS[u.role] || "#888",
                      }}
                    >
                      {u.role}
                    </span>
                    <p
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                "",
                "pending",
                "out_for_delivery",
                "delivered",
                "cancelled",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderStatus(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background:
                      orderStatus === s ? "var(--brand)" : "var(--elevated)",
                    color: orderStatus === s ? "white" : "var(--text-muted)",
                  }}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {loading ? (
                <div
                  className="p-8 text-center rounded-2xl"
                  style={{
                    background: "var(--card)",
                    color: "var(--text-muted)",
                  }}
                >
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : orders.length === 0 ? (
                <div
                  className="p-8 text-center rounded-2xl"
                  style={{
                    background: "var(--card)",
                    color: "var(--text-muted)",
                  }}
                >
                  No orders found
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="flex items-center gap-3 px-5 py-3.5 cursor-pointer"
                      onClick={() =>
                        setExpandedOrder(
                          expandedOrder === order._id ? null : order._id,
                        )
                      }
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className="font-semibold text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {order.userId?.name || "Unknown"}
                          </p>
                          <span
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            → {order.storeId?.name}
                          </span>
                          <span
                            className="text-xs font-mono px-2 py-0.5 rounded"
                            style={{
                              background: "var(--elevated)",
                              color: "var(--text-muted)",
                            }}
                          >
                            #{order._id?.slice(-6)}
                          </span>
                        </div>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className="font-bold text-sm"
                          style={{ color: "var(--brand)" }}
                        >
                          ₹{order.totalPrice}
                        </span>
                        <span
                          className="tag text-[10px] font-semibold"
                          style={{
                            background:
                              (STATUS_COLORS[order.status] || "#888") + "18",
                            color: STATUS_COLORS[order.status] || "#888",
                          }}
                        >
                          {order.status}
                        </span>
                        {expandedOrder === order._id ? (
                          <ChevronUp
                            size={14}
                            style={{ color: "var(--text-muted)" }}
                          />
                        ) : (
                          <ChevronDown
                            size={14}
                            style={{ color: "var(--text-muted)" }}
                          />
                        )}
                      </div>
                    </div>
                    {expandedOrder === order._id && (
                      <div
                        className="px-5 pb-4 pt-2 space-y-1 text-xs"
                        style={{
                          borderTop: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <p>📍 {order.deliveryAddress}</p>
                        <p>
                          📦{" "}
                          {order.items
                            ?.map((i) => `${i.name}×${i.quantity}`)
                            .join(", ")}
                        </p>
                        <p>💳 {order.paymentMethod?.toUpperCase()}</p>
                        {order.userId?.email && <p>📧 {order.userId.email}</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Coupons */}
        {tab === "coupons" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowCouponForm(true)}
                className="btn btn-brand text-sm"
              >
                <Plus size={14} /> New Platform Coupon
              </button>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-20 shimmer"
                    style={{ backgroundColor: "var(--card)" }}
                  />
                ))}
              </div>
            ) : coupons.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-5xl mb-3">🏷️</div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No platform coupons yet
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Platform coupons apply across all stores. Store-specific
                  coupons are managed by store owners.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon._id}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      opacity: coupon.isActive ? 1 : 0.6,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className="font-bold font-mono text-sm"
                          style={{ color: "var(--brand)" }}
                        >
                          {coupon.code}
                        </p>
                        <span
                          className="tag text-[10px]"
                          style={{
                            background: coupon.isActive
                              ? "rgba(34,197,94,0.12)"
                              : "rgba(239,68,68,0.1)",
                            color: coupon.isActive ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                        <span
                          className="tag text-[10px]"
                          style={{
                            background: "var(--elevated)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {coupon.discountType === "percent"
                            ? `${coupon.discountValue}% off`
                            : coupon.discountType === "flat"
                              ? `₹${coupon.discountValue} off`
                              : "Free delivery"}
                        </span>
                        {coupon.storeId && (
                          <span
                            className="tag text-[10px]"
                            style={{
                              background: "rgba(59,130,246,0.1)",
                              color: "#3b82f6",
                            }}
                          >
                            Store: {coupon.storeId?.name || "specific"}
                          </span>
                        )}
                      </div>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {coupon.description || "No description"} · Used{" "}
                        {coupon.usedCount}/{coupon.usageLimit ?? "∞"} · Min ₹
                        {coupon.minOrderAmount}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleCoupon(coupon._id)}
                        className="p-2 rounded-xl transition-all hover:scale-110"
                        style={{
                          background: coupon.isActive
                            ? "rgba(34,197,94,0.1)"
                            : "var(--elevated)",
                          color: coupon.isActive
                            ? "#22c55e"
                            : "var(--text-muted)",
                        }}
                      >
                        {coupon.isActive ? (
                          <ToggleRight size={15} />
                        ) : (
                          <ToggleLeft size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteCoupon(coupon._id)}
                        className="p-2 rounded-xl transition-all hover:scale-110"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          color: "#ef4444",
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showCouponForm && (
              <CouponForm
                onSave={() => {
                  setShowCouponForm(false);
                  load("coupons");
                  addToast("Coupon created!", "success");
                }}
                onClose={() => setShowCouponForm(false)}
              />
            )}
          </div>
        )}

        {/* Banners */}
        {tab === "banners" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {banners.length} banner{banners.length !== 1 ? "s" : ""} ·
                Active ones show on the homepage carousel
              </p>
              <button
                onClick={() => {
                  setEditBanner(null);
                  setShowBannerForm(true);
                }}
                className="btn btn-brand text-sm"
              >
                <Plus size={14} /> New Banner
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-32 shimmer"
                    style={{ backgroundColor: "var(--card)" }}
                  />
                ))}
              </div>
            ) : banners.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-5xl mb-3">🖼️</div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No banners yet
                </p>
                <p
                  className="text-sm mt-1 mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Create homepage banners to promote offers, announce new
                  stores, or highlight deals. When no banners exist, the
                  homepage shows default banners.
                </p>
                <button
                  onClick={() => {
                    setEditBanner(null);
                    setShowBannerForm(true);
                  }}
                  className="btn btn-brand text-sm"
                >
                  <Plus size={14} /> Create First Banner
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((banner) => (
                  <div
                    key={banner._id}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      opacity: banner.isActive ? 1 : 0.6,
                    }}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Mini preview */}
                      <div
                        className={`w-20 h-12 rounded-xl bg-gradient-to-br ${banner.bg} flex items-center justify-center text-xl flex-shrink-0`}
                      >
                        {banner.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className="font-bold text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {banner.title}
                          </p>
                          <span
                            className="tag text-[10px]"
                            style={{
                              background: banner.isActive
                                ? "rgba(34,197,94,0.12)"
                                : "rgba(239,68,68,0.1)",
                              color: banner.isActive ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {banner.isActive ? "Visible" : "Hidden"}
                          </span>
                          <span
                            className="tag text-[10px]"
                            style={{
                              background: "var(--elevated)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Order: {banner.order}
                          </span>
                        </div>
                        <p
                          className="text-xs mt-0.5 truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {banner.sub} · CTA: "{banner.cta}" · Link:{" "}
                          {banner.link}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditBanner(banner);
                            setShowBannerForm(true);
                          }}
                          className="p-2 rounded-xl transition-all hover:scale-110"
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            color: "#3b82f6",
                          }}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => toggleBanner(banner._id)}
                          className="p-2 rounded-xl transition-all hover:scale-110"
                          style={{
                            background: banner.isActive
                              ? "rgba(34,197,94,0.1)"
                              : "var(--elevated)",
                            color: banner.isActive
                              ? "#22c55e"
                              : "var(--text-muted)",
                          }}
                        >
                          {banner.isActive ? (
                            <Eye size={13} />
                          ) : (
                            <EyeOff size={13} />
                          )}
                        </button>
                        <button
                          onClick={() => deleteBanner(banner._id)}
                          className="p-2 rounded-xl transition-all hover:scale-110"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            color: "#ef4444",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showBannerForm && (
              <BannerForm
                banner={editBanner}
                onSave={() => {
                  setShowBannerForm(false);
                  setEditBanner(null);
                  load("banners");
                  addToast(
                    editBanner ? "Banner updated!" : "Banner created!",
                    "success",
                  );
                }}
                onClose={() => {
                  setShowBannerForm(false);
                  setEditBanner(null);
                }}
              />
            )}
          </div>
        )}

        {/* Payouts */}
        {tab === "payouts" && (
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Delivery partner payout requests
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  Approving updates the DB status only — no real money transfer.
                </p>
              </div>
              <div className="flex gap-2">
                {["pending", "approved", "rejected", "all"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPayoutFilter(s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
                    style={{
                      background:
                        payoutFilter === s ? "var(--brand)" : "var(--elevated)",
                      color: payoutFilter === s ? "white" : "var(--text-muted)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl h-24 shimmer"
                    style={{ backgroundColor: "var(--card)" }}
                  />
                ))}
              </div>
            ) : payouts.length === 0 ? (
              <div
                className="text-center py-16 rounded-2xl"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-5xl mb-3">💸</div>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No {payoutFilter === "all" ? "" : payoutFilter} payout
                  requests
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map((req) => {
                  const partner = req.deliveryPartnerId;
                  const isPending = req.status === "pending";
                  const isProc = processingId === req._id;
                  const statusCfg =
                    {
                      pending: {
                        color: "#f59e0b",
                        bg: "rgba(245,158,11,0.12)",
                        label: "Pending",
                      },
                      approved: {
                        color: "#22c55e",
                        bg: "rgba(34,197,94,0.12)",
                        label: "Approved ✓",
                      },
                      rejected: {
                        color: "#ef4444",
                        bg: "rgba(239,68,68,0.12)",
                        label: "Rejected",
                      },
                    }[req.status] || {};

                  return (
                    <div
                      key={req._id}
                      className="rounded-2xl px-5 py-4"
                      style={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div className="flex items-start gap-4 flex-wrap">
                        {/* Avatar + partner info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                            style={{
                              background:
                                "linear-gradient(135deg, #f59e0b, #f97316)",
                            }}
                          >
                            {partner?.name?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="font-bold text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {partner?.name || "Unknown partner"}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {partner?.email}
                              {partner?.vehicleType &&
                                ` · ${partner.vehicleType}`}
                              {partner?.totalDeliveries != null &&
                                ` · ${partner.totalDeliveries} deliveries`}
                            </p>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="flex-shrink-0 text-right">
                          <p
                            className="font-black text-xl"
                            style={{ color: "var(--brand)" }}
                          >
                            ₹{req.amount}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {new Date(req.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "2-digit",
                              },
                            )}
                          </p>
                        </div>

                        {/* Status badge */}
                        <div className="flex-shrink-0">
                          <span
                            className="tag text-xs font-semibold"
                            style={{
                              background: statusCfg.bg,
                              color: statusCfg.color,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                          {req.processedAt && (
                            <p
                              className="text-[10px] mt-1"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {new Date(req.processedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Note (if any) */}
                      {req.note && (
                        <p
                          className="text-xs mt-2 px-3 py-1.5 rounded-lg"
                          style={{
                            background: "var(--elevated)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Note: {req.note}
                        </p>
                      )}

                      {/* Action buttons — pending only */}
                      {isPending && (
                        <div
                          className="flex gap-2 mt-3 pt-3"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          <button
                            onClick={() => handlePayout(req._id, "approved")}
                            disabled={isProc}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-60"
                            style={{
                              background: "rgba(34,197,94,0.12)",
                              color: "#22c55e",
                              border: "1px solid rgba(34,197,94,0.3)",
                            }}
                          >
                            {isProc ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handlePayout(req._id, "rejected")}
                            disabled={isProc}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-60"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.2)",
                            }}
                          >
                            {isProc ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <X size={12} />
                            )}
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
