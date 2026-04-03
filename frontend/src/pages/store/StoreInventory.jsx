/**
 * StoreInventory.jsx — FIXED
 * Uses inventoryAPI from api.js instead of raw api.get() calls.
 * Removed direct api imports to keep API calls centralised.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, RefreshCw, Package, AlertTriangle, TrendingDown,
  ToggleLeft, ToggleRight, Plus, Minus, Edit3, Check, X,
  Search, Loader2, ChefHat, ShoppingBag, AlertCircle, Upload,
  BarChart3,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { inventoryAPI } from "../../api/api";

const THRESHOLDS = {
  Groceries: 10, Snacks: 15, Beverages: 10, Medicines: 5, Other: 5,
};

function StockEditor({ product, storeCategory, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(String(product.stock ?? 0));
  const [saving,  setSaving]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const handleSave = async () => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) { setValue(String(product.stock ?? 0)); setEditing(false); return; }
    setSaving(true);
    try {
      await onUpdate(product._id, { stock: num, operation: "set" });
      setEditing(false);
    } catch {
      setValue(String(product.stock ?? 0));
    } finally { setSaving(false); }
  };

  const handleDelta = async (delta) => {
    setSaving(true);
    try {
      await onUpdate(product._id, {
        operation: delta > 0 ? "add" : "subtract",
        amount:    Math.abs(delta),
      });
    } finally { setSaving(false); }
  };

  const stock     = product.stock ?? 0;
  const threshold = THRESHOLDS[storeCategory] ?? 10;
  const isLow     = product.available && stock > 0 && stock <= threshold;
  const isOut     = !product.available || stock <= 0;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleDelta(-1)}
        disabled={saving || stock <= 0}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
        style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}
      >
        <Minus size={12} />
      </button>

      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef} type="number" min="0" value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setEditing(false); setValue(String(product.stock ?? 0)); }
            }}
            className="w-16 text-center text-sm font-bold rounded-lg px-1 py-1"
            style={{ background: "var(--elevated)", border: "1.5px solid var(--brand)", color: "var(--text-primary)", outline: "none" }}
          />
          {saving ? <Loader2 size={13} className="animate-spin" style={{ color: "var(--brand)" }} /> : (
            <>
              <button onClick={handleSave} className="p-1 rounded" style={{ color: "#22c55e" }}><Check size={13} /></button>
              <button onClick={() => { setEditing(false); setValue(String(product.stock ?? 0)); }} className="p-1 rounded" style={{ color: "#ef4444" }}><X size={13} /></button>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm min-w-[56px] justify-center transition-all hover:scale-105 group"
          style={{
            background: isOut ? "rgba(239,68,68,0.12)" : isLow ? "rgba(245,158,11,0.12)" : "var(--elevated)",
            color:      isOut ? "#ef4444"               : isLow ? "#f59e0b"               : "var(--text-primary)",
            border: `1px solid ${isOut ? "rgba(239,68,68,0.25)" : isLow ? "rgba(245,158,11,0.25)" : "var(--border)"}`,
          }}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : stock}
          <Edit3 size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
        </button>
      )}

      <button
        onClick={() => handleDelta(1)}
        disabled={saving}
        className="w-7 h-7 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 disabled:opacity-40"
        style={{ background: "var(--brand)" }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function FoodItemRow({ product, onToggle, toggling }) {
  const isToggling = toggling === product._id;
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{ background: "var(--card)", border: `1px solid ${product.available ? "var(--border)" : "rgba(239,68,68,0.2)"}`, opacity: product.available ? 1 : 0.7 }}
    >
      <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xl" style={{ background: "var(--elevated)" }}>
        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} /> : "🍽️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs">{product.isVeg ? "🟢" : "🔴"}</span>
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{product.name}</p>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{product.category}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-1 rounded-lg"
          style={{ background: product.available ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: product.available ? "#22c55e" : "#ef4444" }}>
          {product.available ? "Available" : "86'd"}
        </span>
        <button onClick={() => onToggle(product._id)} disabled={isToggling}
          className="p-2 rounded-xl transition-all hover:scale-110"
          style={{ background: product.available ? "rgba(34,197,94,0.1)" : "var(--elevated)", color: product.available ? "#22c55e" : "var(--text-muted)" }}>
          {isToggling ? <Loader2 size={15} className="animate-spin" /> : product.available ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
        </button>
      </div>
    </div>
  );
}

function StockItemRow({ product, storeCategory, threshold, onUpdate, onToggle, toggling }) {
  const isToggling = toggling === product._id;
  const stock      = product.stock ?? 0;
  const isLow      = product.available && stock > 0 && stock <= threshold;
  const isOut      = !product.available || stock <= 0;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{ background: "var(--card)", border: `1px solid ${isOut ? "rgba(239,68,68,0.2)" : isLow ? "rgba(245,158,11,0.2)" : "var(--border)"}` }}
    >
      <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xl" style={{ background: "var(--elevated)" }}>
        {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} /> : "🛍️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{product.name}</p>
          {isLow && <span className="tag text-[10px] flex items-center gap-1" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}><AlertTriangle size={9} /> Low stock</span>}
          {isOut && <span className="tag text-[10px]" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Out of stock</span>}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>₹{product.price}{product.unit ? ` · ${product.unit}` : ""} · {product.category}</p>
      </div>
      <StockEditor product={product} storeCategory={storeCategory} onUpdate={onUpdate} />
      <button
        onClick={() => onToggle(product._id)} disabled={isToggling}
        className="p-2 rounded-xl transition-all hover:scale-110 flex-shrink-0"
        style={{ background: product.available ? "rgba(34,197,94,0.1)" : "var(--elevated)", color: product.available ? "#22c55e" : "var(--text-muted)" }}
        title={product.available ? "Mark unavailable" : "Mark available"}
      >
        {isToggling ? <Loader2 size={15} className="animate-spin" /> : product.available ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
      </button>
    </div>
  );
}

export default function StoreInventory() {
  const { addToast } = useCart();
  const [inventory,    setInventory]    = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState("");
  const [catFilter,    setCatFilter]    = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toggling,     setToggling]     = useState(null);
  const [alerts,       setAlerts]       = useState([]);
  const [bulkMode,     setBulkMode]     = useState(false);
  const [bulkEdits,    setBulkEdits]    = useState({});

  const fetchInventory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await inventoryAPI.get();
      setInventory(data);
      if (!data.isFood) {
        const alertsRes = await inventoryAPI.getAlerts();
        setAlerts(alertsRes.data || []);
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to load inventory", "error");
    } finally { setLoading(false); setRefreshing(false); }
  }, [addToast]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const handleUpdateStock = useCallback(async (productId, body) => {
    const { data } = await inventoryAPI.updateStock(productId, body);
    setInventory((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p._id === productId ? data : p)),
      grouped: Object.fromEntries(
        Object.entries(prev.grouped).map(([cat, prods]) => [
          cat, prods.map((p) => (p._id === productId ? data : p)),
        ])
      ),
    }));
    if (!inventory?.isFood) {
      const alertsRes = await inventoryAPI.getAlerts();
      setAlerts(alertsRes.data || []);
    }
    return data;
  }, [inventory?.isFood]);

  const handleToggle = useCallback(async (productId) => {
    setToggling(productId);
    try {
      const { data } = await inventoryAPI.toggle(productId);
      setInventory((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p._id === productId ? data : p)),
        grouped: Object.fromEntries(
          Object.entries(prev.grouped).map(([cat, prods]) => [
            cat, prods.map((p) => (p._id === productId ? data : p)),
          ])
        ),
      }));
      addToast(data.available ? "Marked as available ✓" : "Marked as unavailable", data.available ? "success" : "info");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to update", "error");
    } finally { setToggling(null); }
  }, [addToast]);

  const handleBulkSave = useCallback(async () => {
    const updates = Object.entries(bulkEdits)
      .map(([productId, stock]) => ({ productId, stock: parseInt(stock, 10) }))
      .filter((u) => !isNaN(u.stock) && u.stock >= 0);
    if (!updates.length) { setBulkMode(false); return; }
    try {
      await inventoryAPI.bulkUpdate(updates);
      addToast(`Updated ${updates.length} item${updates.length > 1 ? "s" : ""} ✓`, "success");
      setBulkEdits({});
      setBulkMode(false);
      fetchInventory(true);
    } catch (err) {
      addToast(err.response?.data?.message || "Bulk update failed", "error");
    }
  }, [bulkEdits, addToast, fetchInventory]);

  if (!inventory) {
    if (loading) return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "var(--brand)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading inventory...</p>
        </div>
      </div>
    );
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-5xl mb-3">🏪</div>
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>No store found</p>
          <Link to="/store/settings" className="btn btn-brand mt-4 text-sm">Create Store</Link>
        </div>
      </div>
    );
  }

  const { storeCategory, isFood, threshold, stats } = inventory;
  const allProducts = inventory.products || [];
  const categories  = ["All", ...new Set(allProducts.map((p) => p.category))];

  const filtered = allProducts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || p.category === catFilter;
    const stock       = p.stock ?? 0;
    const matchStatus =
      statusFilter === "available" ? p.available && (isFood || stock > 0) :
      statusFilter === "low"       ? p.available && stock > 0 && stock <= threshold :
      statusFilter === "out"       ? (!p.available || (!isFood && stock <= 0)) :
      true;
    return matchSearch && matchCat && matchStatus;
  });

  const grouped = filtered.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">

        <div className="flex items-center gap-3 mb-6">
          <Link to="/store/dashboard" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Inventory</h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl"
                style={{ background: isFood ? "rgba(249,115,22,0.1)" : "rgba(6,182,212,0.1)", color: isFood ? "#f97316" : "#06b6d4", border: `1px solid ${isFood ? "rgba(249,115,22,0.2)" : "rgba(6,182,212,0.2)"}` }}>
                {isFood ? <><ChefHat size={11} className="inline mr-1" />Restaurant</> : <><ShoppingBag size={11} className="inline mr-1" />{storeCategory}</>}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {stats.total} items · {stats.available} available{!isFood && ` · ${stats.lowStock} low · ${stats.outOfStock} out`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isFood && (
              <button onClick={() => { setBulkMode((v) => !v); setBulkEdits({}); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ background: bulkMode ? "rgba(255,107,53,0.1)" : "var(--card)", color: bulkMode ? "var(--brand)" : "var(--text-secondary)", border: `1px solid ${bulkMode ? "rgba(255,107,53,0.3)" : "var(--border)"}` }}>
                <Upload size={13} /> {bulkMode ? "Cancel Bulk" : "Bulk Edit"}
              </button>
            )}
            <button onClick={() => fetchInventory(true)} className="p-2.5 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className={`grid gap-3 mb-5 ${isFood ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
          {[
            { label: "Total Items", value: stats.total, color: "var(--brand)", icon: Package },
            { label: "Available",   value: stats.available, color: "#22c55e", icon: ToggleRight },
            ...(!isFood ? [
              { label: "Low Stock",    value: stats.lowStock,   color: "#f59e0b", icon: TrendingDown },
              { label: "Out of Stock", value: stats.outOfStock, color: "#ef4444", icon: AlertCircle },
            ] : []),
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: color + "15" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <p className="font-display font-black text-2xl" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {!isFood && alerts.length > 0 && (
          <div className="rounded-2xl p-4 mb-5 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1.5px solid rgba(245,158,11,0.3)" }}>
            <AlertTriangle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "#f59e0b" }}>{alerts.length} item{alerts.length > 1 ? "s" : ""} running low</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {alerts.slice(0, 6).map((a) => (
                  <span key={a._id} className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                    {a.name} ({a.stock} left)
                  </span>
                ))}
                {alerts.length > 6 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>+{alerts.length - 6} more</span>}
              </div>
            </div>
            <button onClick={() => setStatusFilter("low")} className="text-xs font-semibold flex-shrink-0" style={{ color: "#f59e0b" }}>View all →</button>
          </div>
        )}

        {bulkMode && (
          <div className="rounded-2xl p-4 mb-5 flex items-center justify-between gap-3"
            style={{ background: "rgba(255,107,53,0.08)", border: "1.5px solid rgba(255,107,53,0.25)" }}>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--brand)" }}>Bulk Edit Mode</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Edit stock values below, then click Save All.
                {Object.keys(bulkEdits).length > 0 && ` ${Object.keys(bulkEdits).length} changes pending.`}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setBulkMode(false); setBulkEdits({}); }} className="btn btn-ghost text-xs py-2 px-3"><X size={13} /> Cancel</button>
              <button onClick={handleBulkSave} disabled={!Object.keys(bulkEdits).length} className="btn btn-brand text-xs py-2 px-3">
                <Check size={13} /> Save All ({Object.keys(bulkEdits).length})
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input className="input-theme pl-10 text-sm py-2.5" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {!isFood && (
            <div className="flex gap-1.5">
              {[{ id: "all", label: "All" }, { id: "available", label: "Available" }, { id: "low", label: "Low" }, { id: "out", label: "Out" }].map(({ id, label }) => (
                <button key={id} onClick={() => setStatusFilter(id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                  style={{ background: statusFilter === id ? "var(--brand)" : "var(--elevated)", color: statusFilter === id ? "white" : "var(--text-muted)", border: `1px solid ${statusFilter === id ? "var(--brand)" : "var(--border)"}` }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                style={{ background: catFilter === cat ? "var(--brand)" : "var(--elevated)", color: catFilter === cat ? "white" : "var(--text-muted)", border: `1px solid ${catFilter === cat ? "var(--brand)" : "var(--border)"}` }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-5xl mb-3">{isFood ? "🍽️" : "📦"}</div>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
              {search || statusFilter !== "all" ? "No items match your filter" : "No inventory yet"}
            </p>
            {!search && statusFilter === "all" && (
              <Link to="/store/products" className="btn btn-brand text-sm mt-4">Add Products</Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, prods]) => (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>{cat}</h3>
                  <span className="tag text-xs" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>{prods.length}</span>
                </div>
                <div className="space-y-2">
                  {prods.map((product) =>
                    bulkMode && !isFood ? (
                      <div key={product._id} className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xl" style={{ background: "var(--elevated)" }}>
                          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} /> : "🛍️"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{product.name}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current: {product.stock ?? 0}</p>
                        </div>
                        <input type="number" min="0" placeholder={String(product.stock ?? 0)}
                          value={bulkEdits[product._id] ?? ""}
                          onChange={(e) => setBulkEdits((prev) => ({ ...prev, [product._id]: e.target.value }))}
                          className="w-20 text-center text-sm font-bold rounded-xl px-2 py-2"
                          style={{ background: bulkEdits[product._id] !== undefined ? "rgba(255,107,53,0.06)" : "var(--elevated)", border: `1.5px solid ${bulkEdits[product._id] !== undefined ? "var(--brand)" : "var(--border)"}`, color: "var(--text-primary)", outline: "none" }}
                        />
                      </div>
                    ) : isFood ? (
                      <FoodItemRow key={product._id} product={product} onToggle={handleToggle} toggling={toggling} />
                    ) : (
                      <StockItemRow key={product._id} product={product} storeCategory={storeCategory} threshold={threshold} onUpdate={handleUpdateStock} onToggle={handleToggle} toggling={toggling} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isFood && !bulkMode && (
          <div className="mt-8 rounded-2xl p-4 flex flex-wrap gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-wider w-full" style={{ color: "var(--text-muted)" }}>How it works</p>
            {[
              { dot: "#22c55e", text: `Stock > ${threshold} — Healthy` },
              { dot: "#f59e0b", text: `Stock 1–${threshold} — Low stock warning` },
              { dot: "#ef4444", text: "Stock 0 — Auto marked unavailable" },
            ].map(({ dot, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: dot }} /> {text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}