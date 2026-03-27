import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit3, Trash2, ChevronLeft, Search, Package,
  Check, X, ToggleLeft, ToggleRight, AlertCircle, RefreshCw,
  Leaf, Flame, ChefHat, ShoppingBag
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

// ─── Category maps ───────────────────────────────────────────
const CATEGORY_MAP = {
  Food:       ["Starters", "Soups & Salads", "Main Course", "Breads & Rice", "Biryanis", "Desserts", "Beverages", "Combo Meals", "Snacks", "Other"],
  Groceries:  ["Dairy & Eggs", "Bakery", "Staples & Grains", "Fruits & Vegetables", "Snacks", "Beverages", "Personal Care", "Cleaning", "Frozen", "Other"],
  Snacks:     ["Chips & Namkeen", "Biscuits & Cookies", "Chocolates", "Nuts & Dry Fruits", "Instant Food", "Popcorn", "Other"],
  Beverages:  ["Hot Drinks", "Cold Drinks", "Juices", "Energy Drinks", "Health Drinks", "Water & Soda", "Other"],
  Medicines:  ["Pain Relief", "Cold & Flu", "Vitamins & Supplements", "Digestive", "Skin Care", "Baby Care", "First Aid", "Other"],
  Other:      ["General", "Other"],
};

// ─── Demo data (used when backend is unreachable) ────────────
const DEMO_STORE = {
  _id: "demo_store_food",
  name: "My Restaurant (Demo)",
  category: "Food",
  address: "12, MG Road, Bengaluru",
  phone: "+91 98765 43210",
  rating: 4.6,
  totalRatings: 312,
  isOpen: true,
  deliveryTime: "20-30 min",
  minOrder: 149,
  image: "",
};

const DEMO_PRODUCTS = [
  { _id: "dp1", name: "Butter Chicken", category: "Main Course", price: 280, originalPrice: 320, unit: "Serves 2", available: true, isVeg: false, spiceLevel: "medium", prepTime: "20 min", image: "", storeId: "demo_store_food", description: "Creamy tomato-based curry with tender chicken pieces" },
  { _id: "dp2", name: "Paneer Tikka", category: "Starters", price: 220, unit: "6 pieces", available: true, isVeg: true, spiceLevel: "mild", prepTime: "15 min", image: "", storeId: "demo_store_food", description: "Marinated cottage cheese grilled to perfection" },
  { _id: "dp3", name: "Veg Biryani", category: "Biryanis", price: 180, originalPrice: 200, unit: "Full plate", available: true, isVeg: true, spiceLevel: "medium", prepTime: "25 min", image: "", storeId: "demo_store_food", description: "Aromatic basmati rice with mixed vegetables" },
  { _id: "dp4", name: "Chicken Biryani", category: "Biryanis", price: 260, unit: "Full plate", available: true, isVeg: false, spiceLevel: "medium", prepTime: "30 min", image: "", storeId: "demo_store_food", description: "Slow-cooked chicken biryani with fragrant spices" },
  { _id: "dp5", name: "Dal Makhani", category: "Main Course", price: 160, unit: "1 bowl", available: true, isVeg: true, spiceLevel: "mild", prepTime: "20 min", image: "", storeId: "demo_store_food", description: "Slow-cooked black lentils in rich butter gravy" },
  { _id: "dp6", name: "Gulab Jamun", category: "Desserts", price: 80, unit: "4 pieces", available: true, isVeg: true, spiceLevel: "", prepTime: "5 min", image: "", storeId: "demo_store_food", description: "Soft milk-solid balls soaked in sugar syrup" },
];

// ─── Detect food-type store ─────────────────────────────────
const isFoodStore = (category) => category === "Food";

// ─── Product Form Component ──────────────────────────────────
function ProductForm({ product, store, onSave, onClose }) {
  const storeCategory = store?.category || "Other";
  const isFood = isFoodStore(storeCategory);
  const categories = CATEGORY_MAP[storeCategory] || CATEGORY_MAP.Other;

  const [form, setForm] = useState({
    name:          product?.name          || "",
    description:   product?.description   || "",
    price:         product?.price         || "",
    originalPrice: product?.originalPrice || "",
    category:      product?.category      || categories[0],
    unit:          product?.unit          || "",
    image:         product?.image         || "",
    available:     product?.available     ?? true,
    stock:         product?.stock         ?? 100,
    isVeg:         product?.isVeg         ?? true,
    spiceLevel:    product?.spiceLevel    || "",
    prepTime:      product?.prepTime      || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useCart();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required"); return; }
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) {
      setError("Valid price is required"); return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price:         Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock:         Number(form.stock) || 100,
        storeId:       store._id,
      };

      let saved;
      if (product) {
        const { data } = await api.put(`/products/${product._id}`, payload);
        saved = data;
      } else {
        const { data } = await api.post("/products", payload);
        saved = data;
      }
      onSave(saved, !!product);
      addToast(product ? "Product updated!" : `${isFood ? "Dish" : "Product"} added! ✓`, "success");
    } catch (err) {
      // Demo mode – simulate success
      if (!err.response) {
        const mockSaved = { ...form, _id: product?._id || `demo_${Date.now()}`, price: Number(form.price), storeId: store._id };
        onSave(mockSaved, !!product);
        addToast(product ? "Product updated!" : `${isFood ? "Dish" : "Product"} added! ✓`, "success");
        return;
      }
      const msg = err.response?.data?.message || "Failed to save product";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isFood ? "rgba(249,115,22,0.12)" : "rgba(255,107,53,0.1)" }}>
              {isFood ? <ChefHat size={16} style={{ color: "#f97316" }} /> : <ShoppingBag size={16} style={{ color: "var(--brand)" }} />}
            </div>
            <div>
              <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {product ? `Edit ${isFood ? "Dish" : "Product"}` : `Add ${isFood ? "New Dish" : "New Product"}`}
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {store?.name} · {storeCategory}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto" style={{ maxHeight: "75vh" }}>

          {error && (
            <div className="p-3 rounded-xl text-sm flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Veg / Non-veg toggle — food stores only */}
          {isFood && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-2 block"
                style={{ color: "var(--text-muted)" }}>Type</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => set("isVeg", true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: form.isVeg ? "rgba(34,197,94,0.12)" : "var(--elevated)",
                    color: form.isVeg ? "#22c55e" : "var(--text-muted)",
                    border: `1.5px solid ${form.isVeg ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
                  }}>
                  <Leaf size={14} /> 🟢 Veg
                </button>
                <button type="button" onClick={() => set("isVeg", false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: !form.isVeg ? "rgba(239,68,68,0.1)" : "var(--elevated)",
                    color: !form.isVeg ? "#ef4444" : "var(--text-muted)",
                    border: `1.5px solid ${!form.isVeg ? "rgba(239,68,68,0.35)" : "var(--border)"}`,
                  }}>
                  <Flame size={14} /> 🔴 Non-Veg
                </button>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-muted)" }}>
              {isFood ? "Dish Name" : "Product Name"} *
            </label>
            <input className="input-theme text-sm" required
              placeholder={isFood ? "e.g. Butter Chicken, Masala Dosa, Veg Biryani" : "e.g. Amul Milk 500ml"}
              value={form.name} onChange={e => set("name", e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea className="input-theme text-sm resize-none" rows={2}
              placeholder={isFood ? "Ingredients, cooking style, serving info..." : "Short product description..."}
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-muted)" }}>Price ₹ *</label>
              <input type="number" className="input-theme text-sm" required min="0" step="0.5"
                placeholder="0"
                value={form.price} onChange={e => set("price", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-muted)" }}>MRP ₹ (optional)</label>
              <input type="number" className="input-theme text-sm" min="0" step="0.5"
                placeholder="For discount"
                value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} />
            </div>
          </div>

          {/* Category + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-muted)" }}>Category *</label>
              <select className="input-theme text-sm" value={form.category}
                onChange={e => set("category", e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-muted)" }}>
                {isFood ? "Portion / Serves" : "Unit / Size"}
              </label>
              <input className="input-theme text-sm"
                placeholder={isFood ? "e.g. Serves 2, Full, Half" : "e.g. 500ml, 1kg, 6 pcs"}
                value={form.unit} onChange={e => set("unit", e.target.value)} />
            </div>
          </div>

          {/* Food-specific: spice level + prep time */}
          {isFood && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "var(--text-muted)" }}>Spice Level</label>
                <select className="input-theme text-sm" value={form.spiceLevel}
                  onChange={e => set("spiceLevel", e.target.value)}>
                  <option value="">Not spicy / N/A</option>
                  <option value="mild">🟢 Mild</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hot">🔴 Hot &amp; Spicy</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "var(--text-muted)" }}>Prep Time</label>
                <input className="input-theme text-sm"
                  placeholder="e.g. 15-20 min"
                  value={form.prepTime} onChange={e => set("prepTime", e.target.value)} />
              </div>
            </div>
          )}

          {/* Image URL */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
              style={{ color: "var(--text-muted)" }}>Image URL (optional)</label>
            <input type="url" className="input-theme text-sm"
              placeholder="https://example.com/image.jpg"
              value={form.image} onChange={e => set("image", e.target.value)} />
            {form.image && (
              <div className="mt-2 w-16 h-12 rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}>
                <img src={form.image} alt="preview" className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = "none"; }} />
              </div>
            )}
          </div>

          {/* Stock (non-food) + Availability */}
          <div className={`grid gap-3 ${!isFood ? "grid-cols-2" : "grid-cols-1"}`}>
            {!isFood && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "var(--text-muted)" }}>Stock Qty</label>
                <input type="number" className="input-theme text-sm" min="0"
                  value={form.stock} onChange={e => set("stock", e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block"
                style={{ color: "var(--text-muted)" }}>Availability</label>
              <button type="button" onClick={() => set("available", !form.available)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full"
                style={{
                  background: form.available ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                  color: form.available ? "#22c55e" : "#ef4444",
                  border: `1px solid ${form.available ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)"}`,
                }}>
                {form.available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {form.available ? "Available" : "Unavailable"}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="btn btn-ghost flex-1 justify-center py-3 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="btn btn-brand flex-1 justify-center py-3 text-sm">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Check size={14} /> {product ? "Save Changes" : isFood ? "Add Dish" : "Add Product"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function StoreProducts() {
  const { isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: storeData } = await api.get("/stores/mine");
      setStore(storeData);
      const { data: productsData } = await api.get(`/products/store/${storeData._id}`);
      setProducts(productsData);
      setIsDemoMode(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setError("no_store");
      } else if (!err.response) {
        // Network error – fall back to demo data
        setStore(DEMO_STORE);
        setProducts(DEMO_PRODUCTS);
        setIsDemoMode(true);
      } else {
        setError(err.response?.data?.message || "Failed to load products");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (saved, isEdit) => {
    if (isEdit) {
      setProducts(prev => prev.map(p => p._id === saved._id ? saved : p));
    } else {
      setProducts(prev => [...prev, saved]);
    }
    setShowForm(false);
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    if (isDemoMode) {
      setProducts(prev => prev.filter(p => p._id !== id));
      addToast("Item removed (demo)", "success");
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      addToast("Item deleted", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const toggleAvailability = async (product) => {
    const updated = { ...product, available: !product.available };
    setProducts(prev => prev.map(p => p._id === product._id ? updated : p));
    if (!isDemoMode) {
      try {
        await api.put(`/products/${product._id}`, { available: updated.available });
      } catch {
        // revert on fail
        setProducts(prev => prev.map(p => p._id === product._id ? product : p));
        addToast("Failed to update availability", "error");
      }
    }
  };

  // ── Computed values ──────────────────────────────────────
  const isFood = store ? isFoodStore(store.category) : false;
  const allCats = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });
  const stats = {
    total: products.length,
    available: products.filter(p => p.available).length,
    unavailable: products.filter(p => !p.available).length,
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading products...</p>
        </div>
      </div>
    );
  }

  // ── No store ─────────────────────────────────────────────
  if (error === "no_store") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>
            Create your store first
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            Set up your store profile before adding products.
          </p>
          <Link to="/store/settings" className="btn btn-brand">Create Store</Link>
        </div>
      </div>
    );
  }

  // ── General error ─────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{error}</p>
          <button onClick={fetchData} className="btn btn-brand">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        {/* Demo banner */}
        {isDemoMode && (
          <div className="rounded-xl p-3.5 mb-5 flex items-center gap-3 text-sm"
            style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", color: "#3b82f6" }}>
            <AlertCircle size={15} />
            <span className="flex-1">Demo mode — backend not connected. Changes won't be saved.</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/store/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
              {isFood ? "Menu" : "Products"}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {store?.name} · {stats.total} {isFood ? "dishes" : "items"} · {stats.available} available
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="btn btn-brand text-sm px-4 py-2.5">
              <Plus size={15} /> {isFood ? "Add Dish" : "Add Product"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total",       value: stats.total,       color: "var(--brand)" },
            { label: "Available",   value: stats.available,   color: "#22c55e" },
            { label: "Unavailable", value: stats.unavailable, color: "#f59e0b" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-3 text-center"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <p className="font-bold text-2xl" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input-theme pl-10 text-sm py-2.5"
            placeholder={isFood ? "Search menu items..." : "Search products..."}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Category filter */}
        {allCats.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
            {allCats.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                style={{
                  background: catFilter === cat ? "var(--brand)" : "var(--elevated)",
                  color: catFilter === cat ? "white" : "var(--text-secondary)",
                  border: `1px solid ${catFilter === cat ? "var(--brand)" : "var(--border)"}`,
                }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-5xl mb-3">{isFood ? "🍽️" : "📦"}</div>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
              {search ? "No results found" : `No ${isFood ? "dishes" : "products"} yet`}
            </p>
            {!search && (
              <button
                onClick={() => { setEditTarget(null); setShowForm(true); }}
                className="btn btn-brand text-sm mt-4">
                <Plus size={14} /> {isFood ? "Add Your First Dish" : "Add First Product"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(product => {
              const discount = product.originalPrice && product.originalPrice > product.price
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : null;
              const spiceColors = { mild: "#22c55e", medium: "#f59e0b", hot: "#ef4444" };

              return (
                <div key={product._id}
                  className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    opacity: product.available ? 1 : 0.55,
                  }}>

                  {/* Image */}
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ background: "var(--elevated)" }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = "none"; }} />
                    ) : (
                      <span className="text-2xl">{isFood ? "🍽️" : "🛍️"}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isFood && (
                        <span className="text-xs">{product.isVeg ? "🟢" : "🔴"}</span>
                      )}
                      <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                        {product.name}
                      </p>
                      {discount && discount > 0 && (
                        <span className="tag tag-green text-[9px] py-0 px-1.5 flex-shrink-0">
                          {discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{product.category}</span>
                      {product.unit && <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {product.unit}</span>}
                      {isFood && product.spiceLevel && spiceColors[product.spiceLevel] && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                          style={{ background: spiceColors[product.spiceLevel] + "15", color: spiceColors[product.spiceLevel] }}>
                          {product.spiceLevel === "mild" ? "🟢 Mild" : product.spiceLevel === "medium" ? "🟡 Medium" : "🔴 Hot"}
                        </span>
                      )}
                      {isFood && product.prepTime && (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>⏱ {product.prepTime}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm" style={{ color: "var(--brand)" }}>₹{product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-xs line-through" style={{ color: "var(--text-muted)" }}>
                          ₹{product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
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

      {/* Product Form Modal */}
      {showForm && store && (
        <ProductForm
          product={editTarget}
          store={store}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
        />
      )}
    </div>
  );
}