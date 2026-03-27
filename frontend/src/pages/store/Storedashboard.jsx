import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, TrendingUp, ShoppingBag, Clock, Check, X,
  DollarSign, RefreshCw, Bell, Store, ChevronRight,
  Zap, Plus, AlertCircle, WifiOff, Loader2, Phone
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { storeAPI, orderAPI } from "../../api/api";

const STATUS_COLORS = {
  pending:          { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "Pending",           emoji: "⏳" },
  confirmed:        { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "Confirmed",          emoji: "✅" },
  preparing:        { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  label: "Preparing",          emoji: "👨‍🍳" },
  ready_for_pickup: { color: "#f97316", bg: "rgba(249,115,22,0.12)",  label: "Ready for Pickup",   emoji: "📦" },
  out_for_delivery: { color: "#f97316", bg: "rgba(249,115,22,0.12)",  label: "Out for Delivery",   emoji: "🛵" },
  delivered:        { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   label: "Delivered",          emoji: "🎉" },
  cancelled:        { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "Cancelled",          emoji: "❌" },
};

const NEXT_STATUS = {
  pending:          "confirmed",
  confirmed:        "preparing",
  preparing:        "ready_for_pickup",
  ready_for_pickup: "out_for_delivery",
  out_for_delivery: "delivered",
};

const CATEGORIES = ["Groceries", "Food", "Snacks", "Beverages", "Medicines", "Other"];
const CAT_EMOJIS = { Groceries:"🛒", Food:"🍛", Snacks:"🍿", Beverages:"🧃", Medicines:"💊", Other:"🏪" };
const DELIVERY_TIMES = ["8-12 min","10-15 min","15-20 min","20-30 min","30-45 min"];

function OrderCard({ order, onStatusUpdate, updatingId }) {
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const nextStatus = NEXT_STATUS[order.status];
  const isUpdating = updatingId === order._id;

  return (
    <div className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)" }}>
            {order.userId?.name?.[0] || "C"}
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              {order.userId?.name || "Customer"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="font-bold text-base" style={{ color: "var(--brand)" }}>₹{order.totalPrice}</p>
          <span className="tag text-[10px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
            {sc.emoji} {sc.label}
          </span>
        </div>
      </div>

      {order.userId?.phone && (
        <a href={`tel:${order.userId.phone}`} className="flex items-center gap-1 text-xs mb-1"
          style={{ color: "var(--brand)" }}>
          <Phone size={11} /> {order.userId.phone}
        </a>
      )}
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>📍 {order.deliveryAddress}</p>
      <p className="text-xs mb-3 truncate" style={{ color: "var(--text-secondary)" }}>
        {order.items?.map(i => `${i.name}×${i.quantity || 1}`).join(", ")}
      </p>

      {nextStatus && order.status !== "cancelled" && (
        <div className="flex gap-2">
          <button onClick={() => onStatusUpdate(order._id, nextStatus)} disabled={isUpdating}
            className="btn btn-brand text-xs py-2 px-3 flex-1 justify-center">
            {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <><Check size={12} /> → {STATUS_COLORS[nextStatus]?.label}</>}
          </button>
          {order.status === "pending" && (
            <button onClick={() => onStatusUpdate(order._id, "cancelled")} disabled={isUpdating}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
              <X size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CreateStoreForm({ onCreated }) {
  const { addToast } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "", category: "Groceries", deliveryTime: "20-30 min", minOrder: 0, image: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Name, phone and address are required"); return;
    }
    setSaving(true); setError("");
    try {
      const { data } = await storeAPI.create(form);
      addToast("Store created! 🎉 Now add your products.", "success");
      onCreated(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create store. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen page-enter flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, var(--brand), #ff8c5a)", boxShadow: "0 8px 24px rgba(255,107,53,0.3)" }}>
            🏪
          </div>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: "var(--text-primary)" }}>Create Your Store</h1>
          <p style={{ color: "var(--text-muted)" }}>Set up your store to start receiving orders</p>
        </div>
        <div className="rounded-3xl p-6 shadow-2xl" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Store Name *</label>
              <input className="input-theme text-sm" placeholder="e.g. FreshMart Express, Raj's Kitchen"
                value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Phone *</label>
                <input className="input-theme text-sm" placeholder="+91 98765 43210"
                  value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Min Order (₹)</label>
                <input type="number" min="0" className="input-theme text-sm" placeholder="0"
                  value={form.minOrder} onChange={e => set("minOrder", Number(e.target.value))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>Address *</label>
              <textarea className="input-theme text-sm resize-none" rows={2}
                placeholder="Full store address" value={form.address} onChange={e => set("address", e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Category *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => set("category", cat)}
                    className="py-3 px-2 rounded-xl text-xs font-bold text-center transition-all hover:scale-105"
                    style={{
                      background: form.category === cat ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                      color: form.category === cat ? "var(--brand)" : "var(--text-secondary)",
                      border: `1.5px solid ${form.category === cat ? "var(--brand)" : "var(--border)"}`,
                    }}>
                    <div className="text-xl mb-1">{CAT_EMOJIS[cat]}</div>{cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block" style={{ color: "var(--text-muted)" }}>Delivery Time</label>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_TIMES.map(t => (
                  <button key={t} type="button" onClick={() => set("deliveryTime", t)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{
                      background: form.deliveryTime === t ? "rgba(255,107,53,0.1)" : "var(--elevated)",
                      color: form.deliveryTime === t ? "var(--brand)" : "var(--text-secondary)",
                      border: `1px solid ${form.deliveryTime === t ? "var(--brand)" : "var(--border)"}`,
                    }}>{t}</button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-brand w-full justify-center py-4 text-base">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <><Store size={16} /> Create Store</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function StoreDashboard() {
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const { joinStoreRoom, on } = useSocket();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeLoading, setStoreLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState(false);

  const fetchStore = useCallback(async () => {
    setStoreLoading(true);
    setError("");
    try {
      const { data } = await storeAPI.getMine();
      setStore(data);
      await fetchOrders(data._id);
      // Join socket room for real-time order notifications
      joinStoreRoom(data._id);
    } catch (err) {
      if (err.response?.status === 404) {
        setStore(null);
      } else {
        setError(err.response?.data?.message || "Failed to load store data");
      }
    } finally {
      setStoreLoading(false);
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (storeId, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await orderAPI.getStoreOrders(storeId || store?._id, { limit: 100 });
      setOrders(data);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to load orders", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [store?._id, addToast]);

  useEffect(() => {
    if (isLoggedIn && user?.role === "store") fetchStore();
  }, [isLoggedIn, user, fetchStore]);

  // Socket: listen for new orders
  useEffect(() => {
    const unsub = on("new_order", ({ order: newOrder }) => {
      setOrders(prev => [newOrder, ...prev]);
      setNewOrderAlert(true);
      addToast("🔔 New order received!", "info");
      setTimeout(() => setNewOrderAlert(false), 10000);
    });
    const unsubUpdate = on("order_updated", ({ orderId, status }) => {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    });
    return () => {
      if (typeof unsub === "function") unsub();
      if (typeof unsubUpdate === "function") unsubUpdate();
    };
  }, [on, addToast]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      addToast(`Order → ${STATUS_COLORS[newStatus]?.label}`, "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update order status", "error");
    } finally {
      setUpdatingId(null);
    }
  }, [addToast]);

  const toggleStoreOpen = useCallback(async () => {
    const newIsOpen = !store.isOpen;
    setStore(s => ({ ...s, isOpen: newIsOpen }));
    try {
      const { data } = await storeAPI.update(store._id, { isOpen: newIsOpen });
      setStore(data);
      addToast(newIsOpen ? "Store is now open! 🟢" : "Store is now closed", newIsOpen ? "success" : "warning");
    } catch {
      setStore(s => ({ ...s, isOpen: !newIsOpen }));
      addToast("Failed to update store status", "error");
    }
  }, [store, addToast]);

  if (!isLoggedIn || user?.role !== "store") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Store owners only</h2>
          <Link to="/login" className="btn btn-brand">Sign In</Link>
        </div>
      </div>
    );
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your store...</p>
        </div>
      </div>
    );
  }

  if (!store) return <CreateStoreForm onCreated={(s) => { setStore(s); fetchOrders(s._id); joinStoreRoom(s._id); }} />;

  const pendingOrders = orders.filter(o => o.status === "pending");
  const activeOrders  = orders.filter(o => !["delivered", "cancelled"].includes(o.status));
  const todayRevenue  = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== "cancelled")
    .reduce((s, o) => s + o.totalPrice, 0);
  const totalRevenue  = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.totalPrice, 0);

  const filteredOrders = statusFilter === "active"    ? activeOrders
    : statusFilter === "pending"   ? pendingOrders
    : statusFilter === "delivered" ? orders.filter(o => o.status === "delivered")
    : orders;

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              {store.name}
            </h1>
            <button onClick={toggleStoreOpen}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg mt-1 transition-all hover:scale-105"
              style={{
                background: store.isOpen ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.1)",
                color: store.isOpen ? "#22c55e" : "#ef4444",
              }}>
              <span className={`w-1.5 h-1.5 rounded-full ${store.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
              {store.isOpen ? "Open — tap to close" : "Closed — tap to open"}
            </button>
          </div>
          <button onClick={() => fetchOrders(store._id, true)}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-5 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* New Order Alert (from socket) */}
        {(pendingOrders.length > 0 || newOrderAlert) && (
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3 cursor-pointer"
            style={{ background: "rgba(245,158,11,0.1)", border: "1.5px solid rgba(245,158,11,0.3)" }}
            onClick={() => setStatusFilter("pending")}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
            <Bell size={14} style={{ color: "#f59e0b" }} />
            <p className="font-bold text-sm flex-1" style={{ color: "#f59e0b" }}>
              {pendingOrders.length} new order{pendingOrders.length > 1 ? "s" : ""} waiting!
            </p>
            <ChevronRight size={16} style={{ color: "#f59e0b" }} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today's Revenue", value: `₹${todayRevenue}`,                                           icon: DollarSign, color: "var(--brand)" },
            { label: "Active Orders",   value: activeOrders.length,                                           icon: ShoppingBag, color: "#3b82f6" },
            { label: "Total Delivered", value: orders.filter(o => o.status === "delivered").length,           icon: Package, color: "#22c55e" },
            { label: "Total Revenue",   value: `₹${totalRevenue}`,                                           icon: TrendingUp, color: "#8b5cf6" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-1"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color + "15" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-display font-black text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { to: "/store/products", icon: Package,     label: "Products", sub: store.category === "Food" ? "Menu items" : "Manage", color: "var(--brand)" },
            { to: "/store/orders",   icon: ShoppingBag, label: "Orders",   sub: "All orders",   color: "#3b82f6" },
            { to: "/store/settings", icon: Store,       label: "Settings", sub: "Store info",   color: "#8b5cf6" },
          ].map(({ to, icon: Icon, label, sub, color }) => (
            <Link key={to} to={to}
              className="flex flex-col items-center gap-1 py-4 rounded-2xl text-center transition-all hover:scale-105"
              style={{ background: color + "12", border: `1px solid ${color}30` }}>
              <Icon size={20} style={{ color }} />
              <p className="font-bold text-sm" style={{ color }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
            </Link>
          ))}
        </div>

        {/* Orders section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>Orders</h2>
            <div className="flex gap-1">
              {[
                { id: "active",   label: "Active" },
                { id: "pending",  label: pendingOrders.length > 0 ? `New (${pendingOrders.length})` : "New" },
                { id: "all",      label: "All" },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setStatusFilter(id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: statusFilter === id ? "var(--brand)" : "var(--elevated)",
                    color: statusFilter === id ? "white" : "var(--text-muted)",
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-14 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-4xl mb-3">📦</div>
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                {orders.length === 0 ? "No orders yet" : "No orders in this filter"}
              </p>
              {orders.length === 0 && (
                <Link to="/store/products" className="btn btn-brand text-sm mt-4">
                  <Plus size={14} /> Add Products
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderCard key={order._id} order={order} onStatusUpdate={updateOrderStatus} updatingId={updatingId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}