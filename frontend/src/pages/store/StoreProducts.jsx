import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus, Edit3, Trash2, ChevronLeft, Search, Package,
  Check, X, ToggleLeft, ToggleRight, AlertCircle, RefreshCw,
  Leaf, Flame
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import api from "../../api/api";

// Default product categories per store type
const CATEGORY_MAP = {
  Food: ["Starters", "Main Course", "Breads", "Rice & Biryani", "Desserts", "Beverages", "Combo Meals", "Soups", "Salads", "Other"],
  Groceries: ["Dairy", "Bakery", "Staples", "Fruits & Vegetables", "Snacks", "Beverages", "Personal Care", "Cleaning", "Other"],
  Snacks: ["Chips & Namkeen", "Biscuits & Cookies", "Chocolates", "Nuts & Dry Fruits", "Instant Food", "Other"],
  Beverages: ["Hot Drinks", "Cold Drinks", "Juices", "Energy Drinks", "Health Drinks", "Water", "Other"],
  Medicines: ["Pain Relief", "Cold & Flu", "Vitamins", "Digestive", "Skin Care", "Baby Care", "Other"],
  Other: ["General", "Other"],
};

function ProductForm({ product, store, onSave, onClose }) {
  const isFood = store?.category === "Food";
  const categories = CATEGORY_MAP[store?.category] || CATEGORY_MAP.Other;

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    category: product?.category || categories[0],
    unit: product?.unit || "",
    image: product?.image || "",
    available: product?.available ?? true,
    stock: product?.stock ?? 100,
    // Food-specific
    isVeg: product?.isVeg ?? true,
    spiceLevel: product?.spiceLevel || "",
    prepTime: product?.prepTime || "",
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
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock) || 100,
        storeId: store._id,
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
      addToast(product ? "Product updated!" : "Product added!", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save product";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              {product ? "Edit Product" : "Add New Product"}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {store?.name} · {store?.category}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto" style={{ maxHeight: "75vh" }}>

          {error && (
            <div className="p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
              {error}
            </div>
          )}

          {/* Veg/Non-veg toggle for food stores */}
          {isFood && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set("isVeg", true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: form.isVeg ? "rgba(34,197,94,0.1)" : "var(--elevated)",
                  color: form.isVeg ? "#22c55e" : "var(--text-muted)",
                  border: `1.5px solid ${form.isVeg ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
                }}>
                <Leaf size={14} /> Vegetarian
              </button>
              <button
                type="button"
                onClick={() => set("isVeg", false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: !form.isVeg ? "rgba(239,68,68,0.1)" : "var(--elevated)",
                  color: !form.isVeg ? "#ef4444" : "var(--text-muted)",
                  border: `1.5px solid ${!form.isVeg ? "rgba(239,68,68,0.4)" : "var(--border)"}`,
                }}>
                <Flame size={14} /> Non-Veg
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}>
              {isFood ? "Dish Name" : "Product Name"} *
            </label>
            <input className="input-theme text-sm" required
              placeholder={isFood ? "e.g. Butter Chicken, Veg Biryani" : "e.g. Amul Milk 500ml"}
              value={form.name} onChange={e => set("name", e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea className="input-theme text-sm resize-none" rows={2}
              placeholder={isFood ? "Ingredients, allergens, serving info..." : "Short product description..."}
              value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}>Price ₹ *</label>
              <input type="number" className="input-theme text-sm" required min="0" step="0.5"
                placeholder="0"
                value={form.price} onChange={e => set("price", e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}>Original ₹ (for discount)</label>
              <input type="number" className="input-theme text-sm" min="0" step="0.5"
                placeholder="Optional"
                value={form.originalPrice} onChange={e => set("originalPrice", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}>Category *</label>
              <select className="input-theme text-sm" value={form.category}
                onChange={e => set("category", e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}>
                {isFood ? "Serves / Portion" : "Unit / Size"}
              </label>
              <input className="input-theme text-sm"
                placeholder={isFood ? "e.g. Serves 2, Half, Full" : "e.g. 500ml, 1kg"}
                value={form.unit} onChange={e => set("unit", e.target.value)} />
            </div>
          </div>

          {/* Food-specific fields */}
          {isFood && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                  style={{ color: "var(--text-muted)" }}>Spice Level</label>
                <select className="input-theme text-sm" value={form.spiceLevel}
                  onChange={e => set("spiceLevel", e.target.value)}>
                  <option value="">Not applicable</option>
                  <option value="mild">🟢 Mild</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hot">🔴 Hot</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                  style={{ color: "var(--text-muted)" }}>Prep Time</label>
                <input className="input-theme text-sm"
                  placeholder="e.g. 15-20 min"
                  value={form.prepTime} onChange={e => set("prepTime", e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}>Image URL</label>
            <input type="url" className="input-theme text-sm"
              placeholder="https://..."
              value={form.image} onChange={e => set("image", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isFood && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                  style={{ color: "var(--text-muted)" }}>Stock</label>
                <input type="number" className="input-theme text-sm" min="0"
                  value={form.stock} onChange={e => set("stock", e.target.value)} />
              </div>
            )}
            <div className={isFood ? "col-span-2" : ""}>
              <label className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}>Availability</label>
              <button type="button"
                onClick={() => set("available", !form.available)}
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

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="btn btn-ghost flex-1 justify-center py-3 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="btn btn-brand flex-1 justify-center py-3 text-sm">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Check size={14} /> {product ? "Save Changes" : "Add Product"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StoreProducts() {
  const { isLoggedIn } = useAuth();
  const { addToast } = useCart();
  const [products, setProducts] = useState([]);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
    } catch (err) {
      if (err.response?.status === 404) {
        setError("no_store");
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
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      addToast("Product deleted", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to delete product", "error");
    }
  };

  const toggleAvailability = async (product) => {
    try {
      const { data } = await api.put(`/products/${product._id}`, { available: !product.available });
      setProducts(prev => prev.map(p => p._id === product._id ? data : p));
    } catch {
      // Optimistic UI fallback
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, available: !p.available } : p));
    }
  };

  const allCats = ["All", ...new Set(products.map(p => p.category))];
  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const isFood = store?.category === "Food";

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

  if (error === "no_store") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>
            Create your store first
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            You need to set up your store before you can add products.
          </p>
          <Link to="/store/settings" className="btn btn-brand">
            Create Store
          </Link>
        </div>
      </div>
    );
  }

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
              {store?.name} · {products.length} {isFood ? "dishes" : "items"}
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

        {/* Search & Filter */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input-theme pl-10 text-sm py-2.5"
            placeholder={isFood ? "Search menu items..." : "Search products..."}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

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

        {/* Products / Menu */}
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
                <Plus size={14} /> {isFood ? "Add First Dish" : "Add First Product"}
              </button>
            )}
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
                    opacity: product.available ? 1 : 0.6,
                  }}>
                  {/* Image / icon */}
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
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {product.category}
                      {product.unit ? ` · ${product.unit}` : ""}
                      {isFood && product.spiceLevel ? ` · ${product.spiceLevel === "mild" ? "🟢 Mild" : product.spiceLevel === "medium" ? "🟡 Medium" : "🔴 Hot"}` : ""}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-sm" style={{ color: "var(--brand)" }}>
                        ₹{product.price}
                      </span>
                      {product.originalPrice && (
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