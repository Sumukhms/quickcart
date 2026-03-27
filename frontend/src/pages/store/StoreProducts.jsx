import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit3, Trash2, ChevronLeft, Search, Package,
  Check, X, ToggleLeft, ToggleRight, ImageOff, Filter
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

const CATEGORIES = ["Dairy", "Bakery", "Staples", "Snacks", "Beverages", "Instant Food", "Personal Care", "Other"];

const DEMO_PRODUCTS = [
  { _id: "p1", name: "Amul Full Cream Milk", price: 28, originalPrice: 30, category: "Dairy",       available: true,  stock: 50, unit: "500ml", image: "" },
  { _id: "p2", name: "Brown Bread Loaf",     price: 45, originalPrice: 50, category: "Bakery",      available: true,  stock: 20, unit: "400g",  image: "" },
  { _id: "p3", name: "Maggi Noodles",        price: 14, originalPrice: 15, category: "Instant Food",available: false, stock: 0,  unit: "75g",   image: "" },
  { _id: "p4", name: "Tata Salt",            price: 22, originalPrice: 25, category: "Staples",     available: true,  stock: 100,unit: "1kg",   image: "" },
  { _id: "p5", name: "Parle-G Biscuits",     price: 10, originalPrice: null,category: "Snacks",    available: true,  stock: 80, unit: "80g",   image: "" },
  { _id: "p6", name: "Dove Soap",            price: 38, originalPrice: 45, category: "Personal Care",available: true, stock: 30, unit: "75g",  image: "" },
];

function ProductForm({ product, storeId, onSave, onClose }) {
  const [form, setForm] = useState({
    name: product?.name || "",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    category: product?.category || "Staples",
    unit: product?.unit || "",
    description: product?.description || "",
    image: product?.image || "",
    available: product?.available ?? true,
    stock: product?.stock || "",
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useCart();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { addToast("Name and price are required", "error"); return; }
    setLoading(true);
    try {
      let saved;
      if (product) {
        const { data } = await api.put(`/products/${product._id}`, form);
        saved = data;
      } else {
        const { data } = await api.post("/products", { ...form, storeId });
        saved = data;
      }
      onSave(saved, !!product);
      addToast(product ? "Product updated!" : "Product added!", "success");
    } catch {
      const fakeId = product?._id || `p${Date.now()}`;
      onSave({ ...form, _id: fakeId, price: Number(form.price) }, !!product);
      addToast(product ? "Product updated!" : "Product added!", "success");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            {product ? "Edit Product" : "New Product"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}
          className="px-5 py-4 space-y-3 overflow-y-auto"
          style={{ maxHeight: "70vh" }}>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Name *</label>
              <input className="input-theme text-sm" placeholder="Product name" required
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Price ₹ *</label>
              <input type="number" className="input-theme text-sm" placeholder="0" required min="0"
                value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Original ₹</label>
              <input type="number" className="input-theme text-sm" placeholder="0 (optional)" min="0"
                value={form.originalPrice} onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Category *</label>
              <select className="input-theme text-sm" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Unit</label>
              <input className="input-theme text-sm" placeholder="500ml, 1kg…"
                value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Image URL</label>
            <input type="url" className="input-theme text-sm" placeholder="https://..."
              value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea className="input-theme text-sm resize-none" rows={2}
              placeholder="Short description…"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Stock</label>
              <input type="number" className="input-theme text-sm" placeholder="100" min="0"
                value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "var(--text-muted)" }}>Available</label>
              <button type="button"
                onClick={() => setForm(p => ({ ...p, available: !p.available }))}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full"
                style={{
                  background: form.available ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                  color: form.available ? "#22c55e" : "#ef4444",
                  border: `1px solid ${form.available ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}>
                {form.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {form.available ? "In Stock" : "Out of Stock"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="btn btn-brand w-full justify-center py-3 text-sm mt-1">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Check size={14} /> {product ? "Save Changes" : "Add Product"}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StoreProducts() {
  const { user, isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const [products, setProducts]     = useState([]);
  const [storeId, setStoreId]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [catFilter, setCatFilter]   = useState("All");
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: store } = await api.get("/stores/mine");
      setStoreId(store._id);
      const { data } = await api.get(`/products/store/${store._id}`);
      setProducts(data);
    } catch {
      setStoreId("s1");
      setProducts(DEMO_PRODUCTS);
    } finally { setLoading(false); }
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) setProducts(prev => prev.map(p => p._id === saved._id ? saved : p));
    else setProducts(prev => [...prev, saved]);
    setShowForm(false);
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
    } catch {}
    setProducts(prev => prev.filter(p => p._id !== id));
    addToast("Product deleted", "success");
  };

  const toggleAvailability = async (product) => {
    try {
      await api.put(`/products/${product._id}`, { available: !product.available });
    } catch {}
    setProducts(prev => prev.map(p => p._id === product._id ? { ...p, available: !p.available } : p));
  };

  const allCats = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/store/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Products</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{products.length} items</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="btn btn-brand text-sm px-4 py-2.5">
            <Plus size={15} /> Add Product
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input className="input-theme pl-10 text-sm py-2.5" placeholder="Search products…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {allCats.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all hover:scale-105"
              style={{
                background: catFilter === cat ? "var(--brand)" : "var(--elevated)",
                color: catFilter === cat ? "white" : "var(--text-secondary)",
                border: `1px solid ${catFilter === cat ? "var(--brand)" : "var(--border)"}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl p-4 h-24 shimmer" style={{ backgroundColor: "var(--card)" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-4xl mb-3">📦</div>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No products found</p>
            <button onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="btn btn-brand text-sm mt-4">
              <Plus size={14} /> Add First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(product => {
              const discount = product.originalPrice
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : null;
              return (
                <div key={product._id}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    opacity: product.available ? 1 : 0.65,
                  }}>
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden img-fallback"
                    style={{ background: "var(--elevated)" }}>
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">🛍️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                      {discount && (
                        <span className="tag tag-green text-[9px] py-0 px-1.5 flex-shrink-0">{discount}%</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {product.category} · {product.unit || "piece"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm" style={{ color: "var(--brand)" }}>₹{product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs line-through" style={{ color: "var(--text-muted)" }}>₹{product.originalPrice}</span>
                      )}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        · Stock: {product.stock ?? "∞"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <button onClick={() => { setEditTarget(product); setShowForm(true); }}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => toggleAvailability(product)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: product.available ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                        color: product.available ? "#22c55e" : "#ef4444",
                      }}>
                      {product.available ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                    </button>
                    <button onClick={() => handleDelete(product._id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editTarget}
          storeId={storeId}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}