import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package, TrendingUp, ShoppingBag, Plus, Edit3, Trash2,
  ChevronLeft, Clock, Check, X, DollarSign, BarChart3, RefreshCw
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../api/api";

const STATUS_COLORS = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Pending" },
  confirmed: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Confirmed" },
  preparing: { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", label: "Preparing" },
  out_for_delivery: { color: "#f97316", bg: "rgba(249,115,22,0.12)", label: "Out for Delivery" },
  delivered: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "Delivered" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Cancelled" },
};

export default function StoreDashboard() {
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const navigate = useNavigate();

  const [tab, setTab] = useState("orders"); // orders | products | analytics
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", originalPrice: "", category: "", unit: "", description: "", image: "" });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user?.role === "store") {
      fetchDashboardData();
    } else if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const storeRes = await api.get("/stores/mine");
      setStore(storeRes.data);
      const [ordersRes, productsRes] = await Promise.all([
        api.get(`/orders/store/${storeRes.data._id}`),
        api.get(`/products/store/${storeRes.data._id}`),
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
    } catch {
      // Demo data
      setStore({ _id: "s1", name: "My Demo Store", category: "Groceries", isOpen: true, rating: 4.7, totalRatings: 234 });
      setOrders([
        { _id: "o1", status: "pending", totalPrice: 245, createdAt: new Date().toISOString(), userId: { name: "Raj Kumar", phone: "+91 98765 43210" }, items: [{ name: "Milk" }, { name: "Bread" }] },
        { _id: "o2", status: "preparing", totalPrice: 180, createdAt: new Date(Date.now() - 1800000).toISOString(), userId: { name: "Priya Singh", phone: "+91 87654 32109" }, items: [{ name: "Rice 1kg" }] },
        { _id: "o3", status: "delivered", totalPrice: 320, createdAt: new Date(Date.now() - 86400000).toISOString(), userId: { name: "Arjun Mehta", phone: "+91 76543 21098" }, items: [{ name: "Veggies" }] },
      ]);
      setProducts([
        { _id: "p1", name: "Amul Milk 500ml", price: 28, category: "Dairy", available: true, stock: 50 },
        { _id: "p2", name: "Brown Bread", price: 45, originalPrice: 50, category: "Bakery", available: true, stock: 20 },
        { _id: "p3", name: "Maggi Noodles", price: 14, category: "Instant Food", available: false, stock: 0 },
      ]);
    } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      addToast(`Order marked as ${newStatus}`, "success");
    } catch {
      addToast("Failed to update order", "error");
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
      addToast("Product deleted", "success");
    } catch { addToast("Failed to delete product", "error"); }
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingProduct) {
        const { data } = await api.put(`/products/${editingProduct._id}`, productForm);
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? data : p));
        addToast("Product updated!", "success");
      } else {
        const { data } = await api.post("/products", { ...productForm, storeId: store._id });
        setProducts(prev => [...prev, data]);
        addToast("Product added!", "success");
      }
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: "", price: "", originalPrice: "", category: "", unit: "", description: "", image: "" });
    } catch { addToast("Failed to save product", "error"); }
    finally { setFormLoading(false); }
  };

  if (!isLoggedIn || user?.role !== "store") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center px-4">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Store Dashboard</h2>
          <p className="mb-5" style={{ color: "var(--text-muted)" }}>This area is for store owners only</p>
          <Link to="/" className="btn btn-brand">Go Home</Link>
        </div>
      </div>
    );
  }

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const todayRevenue = orders
    .filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== "cancelled")
    .reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
                {store?.name || "Dashboard"}
              </h1>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                <span style={{ color: "var(--text-muted)" }}>{store?.isOpen ? "Open" : "Closed"}</span>
              </div>
            </div>
          </div>
          <button onClick={() => fetchDashboardData()}
            className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Today's Revenue", value: `₹${todayRevenue}`, icon: DollarSign, color: "var(--brand)" },
            { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "#3b82f6" },
            { label: "Pending", value: pendingCount, icon: Clock, color: "#f59e0b" },
            { label: "Products", value: products.length, icon: Package, color: "#22c55e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-1"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color + "15" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-display font-black text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: "orders", label: "Orders", count: pendingCount },
            { id: "products", label: "Products", count: null },
            { id: "analytics", label: "Analytics", count: null },
          ].map(({ id, label, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === id ? "var(--brand)" : "var(--card)",
                color: tab === id ? "white" : "var(--text-secondary)",
                border: `1.5px solid ${tab === id ? "var(--brand)" : "var(--border)"}`,
              }}>
              {label}
              {count > 0 && (
                <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                  style={{ background: tab === id ? "rgba(255,255,255,0.25)" : "var(--brand)", color: "white" }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📦</div>
                <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No orders yet</p>
              </div>
            ) : orders.map(order => {
              const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              const NEXT_STATUS = { pending: "confirmed", confirmed: "preparing", preparing: "out_for_delivery", out_for_delivery: "delivered" };
              const nextStatus = NEXT_STATUS[order.status];
              return (
                <div key={order._id} className="rounded-2xl p-5"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold" style={{ color: "var(--text-primary)" }}>
                          {order.userId?.name || "Customer"}
                        </p>
                        <span className="tag text-[10px] font-semibold" style={{ background: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {order.items?.map(i => i.name).join(", ").slice(0, 50)}...
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-base" style={{ color: "var(--brand)" }}>₹{order.totalPrice}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  {nextStatus && order.status !== "cancelled" && (
                    <div className="flex gap-2">
                      <button onClick={() => updateOrderStatus(order._id, nextStatus)}
                        className="btn btn-brand text-xs py-2 px-3 flex-1 justify-center">
                        <Check size={12} /> Mark as {STATUS_COLORS[nextStatus]?.label}
                      </button>
                      {order.status === "pending" && (
                        <button onClick={() => updateOrderStatus(order._id, "cancelled")}
                          className="text-xs py-2 px-3 rounded-xl font-semibold transition-all hover:scale-105"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Products tab */}
        {tab === "products" && (
          <div>
            <button onClick={() => { setShowProductForm(true); setEditingProduct(null); setProductForm({ name: "", price: "", originalPrice: "", category: "", unit: "", description: "", image: "" }); }}
              className="btn btn-brand text-sm mb-4">
              <Plus size={15} /> Add Product
            </button>

            {/* Product form modal */}
            {showProductForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
                      {editingProduct ? "Edit Product" : "New Product"}
                    </h3>
                    <button onClick={() => { setShowProductForm(false); setEditingProduct(null); }}
                      className="p-2 rounded-xl" style={{ color: "var(--text-muted)" }}>
                      <X size={16} />
                    </button>
                  </div>
                  <form onSubmit={submitProduct} className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                    {[
                      { key: "name", label: "Product Name", type: "text", required: true },
                      { key: "category", label: "Category", type: "text", required: true },
                      { key: "price", label: "Price (₹)", type: "number", required: true },
                      { key: "originalPrice", label: "Original Price (₹, optional)", type: "number" },
                      { key: "unit", label: "Unit (e.g. 500ml, 1kg)", type: "text" },
                      { key: "image", label: "Image URL (optional)", type: "url" },
                    ].map(({ key, label, type, required }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
                        <input type={type} className="input-theme text-sm" placeholder={label} required={required}
                          value={productForm[key]} onChange={e => setProductForm(p => ({ ...p, [key]: e.target.value }))} />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
                      <textarea className="input-theme text-sm resize-none" rows={2}
                        value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={formLoading} className="btn btn-brand flex-1 justify-center text-sm py-2.5">
                        {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editingProduct ? "Save Changes" : "Add Product"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map(product => (
                <div key={product._id} className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", opacity: product.available ? 1 : 0.6 }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "var(--elevated)" }}>
                    {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl" /> : "🛍️"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{product.category}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: "var(--brand)" }}>₹{product.price}</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => {
                      setEditingProduct(product);
                      setProductForm({ name: product.name, price: product.price, originalPrice: product.originalPrice || "", category: product.category, unit: product.unit || "", description: product.description || "", image: product.image || "" });
                      setShowProductForm(true);
                    }} className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteProduct(product._id)}
                      className="p-2 rounded-xl transition-all hover:scale-110"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics tab */}
        {tab === "analytics" && (
          <div className="space-y-4">
            <div className="rounded-3xl p-6 text-center"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <BarChart3 size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <h3 className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Analytics Coming Soon</h3>
              <p style={{ color: "var(--text-muted)" }}>Revenue charts, customer insights, and more</p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Revenue", value: `₹${orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.totalPrice, 0)}` },
                { label: "Completed Orders", value: orders.filter(o => o.status === "delivered").length },
                { label: "Cancellation Rate", value: `${orders.length ? ((orders.filter(o => o.status === "cancelled").length / orders.length) * 100).toFixed(0) : 0}%` },
                { label: "Avg Order Value", value: orders.length ? `₹${(orders.reduce((s, o) => s + o.totalPrice, 0) / orders.length).toFixed(0)}` : "₹0" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-2xl p-4" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                  <p className="font-bold text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}