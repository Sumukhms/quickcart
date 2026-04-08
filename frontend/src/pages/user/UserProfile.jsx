import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Save,
  X,
  Package,
  Star,
  ChevronRight,
  LogOut,
  Heart,
  Trash2,
  Truck,
  Store as StoreIcon,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoriteContext";
import DeleteAccountModal from "../../components/ui/DeleteAccountModal";
import api from "../../api/api";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f59e0b" },
  confirmed: { label: "Confirmed", color: "#3b82f6" },
  preparing: { label: "Preparing", color: "#8b5cf6" },
  ready_for_pickup: { label: "Ready", color: "#f97316" },
  out_for_delivery: { label: "On the way", color: "#f97316" },
  delivered: { label: "Delivered", color: "#22c55e" },
  cancelled: { label: "Cancelled", color: "#ef4444" },
};

const CAT_EMOJIS = {
  Groceries: "🛒",
  Food: "🍛",
  Snacks: "🍿",
  Beverages: "🧃",
  Medicines: "💊",
  Other: "🏪",
};

const ROLE_META = {
  customer: {
    label: "Customer",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    icon: User,
  },
  store: {
    label: "Store Owner",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: StoreIcon,
  },
  delivery: {
    label: "Delivery Partner",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    icon: Truck,
  },
  admin: {
    label: "Admin",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: User,
  },
};

/* ── Sanitise phone: digits only, max 10 ─────────────────── */
function sanitizePhone(val) {
  return val.replace(/\D/g, "").slice(0, 10);
}

export default function UserProfile() {
  const { user, logout, updateUser } = useAuth();
  const { addToast, clearCart } = useCart();
  const { favorites, toggleFavorite } = useFavorites();

  const addAddress = async (newAddr) => {
    if (!newAddr?.trim()) {
      addToast("Address cannot be empty", "error");
      return;
    }
    try {
      const { data } = await api.post("/auth/addresses", {
        address: newAddr.trim(),
      });
      updateUser({ addresses: data.addresses });
      addToast("Address added! ✓", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to add address", "error");
    }
  };

  const removeAddress = async (index) => {
    try {
      const { data } = await api.delete(`/auth/addresses/${index}`);
      updateUser({ addresses: data.addresses });
      addToast("Address removed! ✓", "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to remove address",
        "error",
      );
    }
  };

  const setDefaultAddress = async (index) => {
    try {
      const { data } = await api.patch(`/auth/addresses/${index}/default`);
      updateUser({ addresses: data.addresses });
      addToast("Default address updated! ✓", "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to set default address",
        "error",
      );
    }
  };

  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: (user.phone || "").replace(/\D/g, ""),
        address: user.address || "",
      });
    }
    fetchRecentOrders();
  }, [user]);

  const fetchRecentOrders = async () => {
    try {
      const { data } = await api.get("/orders/my");
      setRecentOrders(data.slice(0, 3));
    } catch {
      setRecentOrders([]);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      addToast("Name cannot be empty", "error");
      return;
    }
    if (form.phone && form.phone.replace(/\D/g, "").length !== 10) {
      addToast("Phone number must be exactly 10 digits", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address?.trim() || "",
      };
      if (form.phone.trim()) {
        payload.phone = form.phone.replace(/\D/g, "");
      }
      await api.put("/auth/profile", payload);
      updateUser(payload);
      addToast("Profile updated! ✓", "success");
      setEditing(false);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    clearCart();
    addToast("Signed out successfully", "info");
    navigate("/login");
  };

  const handleAccountDeleted = () => {
    logout();
    clearCart();
    addToast("Your account has been permanently deleted.", "info");
    navigate("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  const roleMeta = ROLE_META[user?.role] || ROLE_META.customer;

  // Role-specific quick links
  const roleLinks = {
    store: [
      {
        icon: StoreIcon,
        label: "Store Dashboard",
        sub: "Manage your store",
        to: "/store/dashboard",
        color: "#3b82f6",
      },
      {
        icon: Package,
        label: "Store Orders",
        sub: "View incoming orders",
        to: "/store/orders",
        color: "var(--brand)",
      },
      {
        icon: BarChart3,
        label: "Inventory",
        sub: "Manage stock levels",
        to: "/store/inventory",
        color: "#22c55e",
      },
    ],
    delivery: [
      {
        icon: Truck,
        label: "Delivery Dashboard",
        sub: "Find available orders",
        to: "/delivery/dashboard",
        color: "#f59e0b",
      },
      {
        icon: MapPin,
        label: "Active Delivery",
        sub: "Current delivery",
        to: "/delivery/active",
        color: "var(--brand)",
      },
      {
        icon: Package,
        label: "Delivery History",
        sub: "Past deliveries",
        to: "/delivery/history",
        color: "#22c55e",
      },
    ],
    customer: [],
    admin: [],
  };

  const extraLinks = roleLinks[user?.role] || [];

  return (
    <div
      className="min-h-screen page-enter"
      style={{ backgroundColor: "var(--bg)" }}
    >
      {/* ── Hero header ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a0a00 0%, #2d1200 50%, #1a0a00 100%)",
          paddingBottom: "2rem",
        }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-25 pointer-events-none"
          style={{
            background: "radial-gradient(circle, var(--brand), transparent)",
            transform: "translate(35%, -35%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #ff8c5a, transparent)",
            transform: "translate(-30%, 30%)",
          }}
        />

        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-center gap-5">
            {/* Avatar — initials only, no broken camera button */}
            <div className="relative flex-shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display font-black text-2xl shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, var(--brand), #ff8c5a)",
                  boxShadow: "0 0 30px rgba(255,107,53,0.45)",
                }}
              >
                {initials}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  className="input-theme text-xl font-bold mb-2 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{
                    maxWidth: 260,
                    background: "rgba(255,255,255,0.1)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "white",
                  }}
                />
              ) : (
                <h1 className="font-display font-bold text-2xl text-white mb-1">
                  {user?.name}
                </h1>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="tag text-xs font-semibold"
                  style={{ background: roleMeta.bg, color: roleMeta.color }}
                >
                  {roleMeta.label}
                </span>
                {user?.isEmailVerified && (
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {editing ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        name: user.name || "",
                        phone: user.phone || "",
                        address: user.address || "",
                      });
                    }}
                    className="p-2.5 rounded-xl text-white/50 hover:text-white transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <X size={15} />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                    style={{ background: "var(--brand)", color: "white" }}
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={13} /> Save
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <Edit3 size={13} /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-2xl mx-auto px-4 py-5 pb-20 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Package,
              label: "Orders",
              value: recentOrders.length || "–",
              color: "var(--brand)",
            },
            { icon: Star, label: "Reviews", value: "–", color: "#f59e0b" },
            {
              icon: Heart,
              label: "Saved",
              value: favorites.length,
              color: "#ef4444",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="rounded-2xl p-4 text-center transition-all hover:-translate-y-1"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <Icon size={18} className="mx-auto mb-2" style={{ color }} />
              <p
                className="font-display font-bold text-xl"
                style={{ color: "var(--text-primary)" }}
              >
                {value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Contact Info */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2
              className="font-bold text-xs uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Contact Information
            </h2>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4 px-5 py-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.1)" }}
            >
              <Mail size={14} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </p>
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.email}
              </p>
            </div>
            <span className="tag tag-green text-[10px] flex-shrink-0">
              Verified
            </span>
          </div>

          {/* Phone */}
          <div
            className="flex items-center gap-4 px-5 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,107,53,0.1)" }}
            >
              <Phone size={14} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Phone
              </p>
              {editing ? (
                <div>
                  <input
                    className="input-theme text-sm py-2"
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    value={form.phone || ""}
                    onChange={(e) =>
                      setForm({ ...form, phone: sanitizePhone(e.target.value) })
                    }
                  />
                  <p
                    className="text-[10px] mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {form.phone.length}/10 digits
                  </p>
                </div>
              ) : (
                <p
                  className="text-sm font-medium"
                  style={{
                    color: form.phone
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                  }}
                >
                  {form.phone || "Add phone number"}
                </p>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div
            className="px-5 py-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Saved Addresses
              </p>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {user?.addresses?.length || 0}/5
              </span>
            </div>

            {/* Saved addresses list */}
            {user?.addresses?.length > 0 ? (
              <div className="space-y-2 mb-3">
                {user.addresses.map((addr, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                    style={{
                      background: "var(--hover)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,107,53,0.1)" }}
                    >
                      <MapPin size={12} style={{ color: "var(--brand)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {addr}
                      </p>
                      {i === 0 && (
                        <span className="tag tag-green text-[10px] mt-1">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {i !== 0 && (
                        <button
                          onClick={() => setDefaultAddress(i)}
                          className="p-1.5 rounded-lg text-xs font-medium transition-colors hover:scale-105"
                          style={{
                            background: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                          }}
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => removeAddress(i)}
                        className="p-1.5 rounded-lg transition-colors hover:scale-105"
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          color: "#ef4444",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="text-sm mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                No saved addresses yet
              </p>
            )}

            {/* Add new address */}
            <div className="flex gap-2">
              <input
                className="input-theme text-sm py-2 flex-1"
                placeholder="Add new address"
                value={form.newAddress || ""}
                onChange={(e) =>
                  setForm({ ...form, newAddress: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addAddress(form.newAddress);
                    setForm({ ...form, newAddress: "" });
                  }
                }}
              />
              <button
                onClick={() => {
                  addAddress(form.newAddress);
                  setForm({ ...form, newAddress: "" });
                }}
                disabled={!form.newAddress?.trim()}
                className="px-3 py-2 rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "var(--brand)", color: "white" }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Role-specific quick links */}
        {extraLinks.length > 0 && (
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {user?.role === "store" ? "Store Management" : "Delivery Tools"}
              </h2>
            </div>
            {extraLinks.map(({ icon: Icon, label, sub, to, color }, i) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 px-5 py-4 transition-colors"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + "15" }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {sub}
                  </p>
                </div>
                <ChevronRight
                  size={15}
                  style={{ color: "var(--text-muted)" }}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Saved Stores — only for customers */}
        {user?.role === "customer" && favorites.length > 0 && (
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2
                className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}
              >
                <Heart size={12} style={{ color: "#ef4444" }} /> Saved Stores
              </h2>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                {favorites.length} saved
              </span>
            </div>
            {favorites.map((store, i) => (
              <div
                key={store._id}
                className="flex items-center gap-4 px-5 py-4 group"
                style={{
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <Link
                  to={`/user/store/${store._id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--elevated)" }}
                  >
                    {CAT_EMOJIS[store.category] || "🏪"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {store.name}
                    </p>
                    <div
                      className="flex items-center gap-2 text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? "bg-green-400" : "bg-red-400"}`}
                      />
                      {store.isOpen ? "Open" : "Closed"} · {store.deliveryTime}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 text-xs flex-shrink-0"
                    style={{ color: "#f59e0b" }}
                  >
                    ⭐ {store.rating?.toFixed(1) || "4.5"}
                  </div>
                </Link>
                <button
                  onClick={() => toggleFavorite(store._id)}
                  className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  style={{
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.08)",
                  }}
                  title="Remove from saved"
                >
                  <Heart size={14} fill="#ef4444" stroke="#ef4444" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <h2
                className="font-bold text-xs uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                Recent Orders
              </h2>
              <Link
                to="/user/orders"
                className="text-xs font-semibold"
                style={{ color: "var(--brand)" }}
              >
                View all →
              </Link>
            </div>
            {recentOrders.map((order, i) => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              return (
                <Link
                  key={order._id}
                  to={`/user/orders/${order._id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--border)" : "none",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: "var(--elevated)" }}
                  >
                    🛍️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {order.storeId?.name || "Store"}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · ₹{order.totalPrice}
                    </p>
                  </div>
                  <span
                    className="tag text-[10px] font-semibold flex-shrink-0"
                    style={{ background: sc.color + "20", color: sc.color }}
                  >
                    {sc.label}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--text-muted)" }}
                  />
                </Link>
              );
            })}
          </div>
        )}

        {/* Standard quick links */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {[
            {
              icon: Package,
              label: "My Orders",
              sub: "Track and manage orders",
              to: "/user/orders",
              color: "var(--brand)",
            },
            ...(user?.role === "customer"
              ? [
                  {
                    icon: Heart,
                    label: "Saved Stores",
                    sub: `${favorites.length} stores saved`,
                    to: "/user/home",
                    color: "#ef4444",
                  },
                ]
              : []),
          ].map(({ icon: Icon, label, sub, to, color }, i) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-4 px-5 py-4 transition-colors"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: color + "15" }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {label}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {sub}
                </p>
              </div>
              <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
            </Link>
          ))}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.01]"
          style={{
            background: "rgba(239,68,68,0.08)",
            color: "#ef4444",
            border: "1.5px solid rgba(239,68,68,0.18)",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>

        {/* Danger Zone */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            border: "1px solid rgba(239,68,68,0.2)",
            backgroundColor: "var(--card)",
          }}
        >
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}
          >
            <h2
              className="font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              style={{ color: "#ef4444" }}
            >
              ⚠️ Danger Zone
            </h2>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  Delete Account
                </p>
                <p
                  className="text-xs mt-0.5 max-w-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Permanently remove your account, order history, and all
                  personal data. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all hover:scale-105"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={handleAccountDeleted}
        user={user}
      />
    </div>
  );
}
