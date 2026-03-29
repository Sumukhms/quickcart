/**
 * UserStorePage — UPDATED
 *
 * Changes:
 *   1. FavoriteButton (badge variant) in store hero
 *   2. Veg/Non-Veg filter toggle — shown only for food stores
 *   3. SearchBar already existed — verified it's wired correctly
 *   4. All other UI unchanged
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, Link }                  from "react-router-dom";
import {
  ArrowLeft, Star, Clock, MapPin, Phone, AlertCircle, RefreshCw,
  Leaf, Flame,
} from "lucide-react";
import { storeAPI, productAPI }       from "../../api/api";
import ProductCard                    from "../../components/store/ProductCard";
import SearchBar                      from "../../components/ui/SearchBar";
import FavoriteButton                 from "../../components/ui/FavoriteButton";
import { PageLoader, EmptyState }     from "../../components/ui/Skeleton";

const CAT_GRADIENT = {
  Groceries: "from-emerald-600 to-teal-700",
  Food:      "from-orange-600 to-red-700",
  Snacks:    "from-yellow-500 to-orange-600",
  Beverages: "from-blue-600 to-cyan-700",
  Medicines: "from-red-600 to-rose-700",
  Other:     "from-purple-600 to-violet-700",
};
const CAT_EMOJI = {
  Groceries: "🛒", Food: "🍛", Snacks: "🍿",
  Beverages: "🧃", Medicines: "💊", Other: "🏪",
};

// Veg filter options
const VEG_OPTIONS = [
  { id: "all",     label: "All",     icon: null },
  { id: "veg",     label: "Veg",     icon: Leaf,  color: "#22c55e" },
  { id: "nonveg",  label: "Non-Veg", icon: Flame, color: "#ef4444" },
];

export default function UserStorePage() {
  const { id } = useParams();
  const [store,          setStore]          = useState(null);
  const [products,       setProducts]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  // ── NEW: veg filter ──
  const [vegFilter,      setVegFilter]      = useState("all"); // "all" | "veg" | "nonveg"

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeRes, prodRes] = await Promise.all([
        storeAPI.getById(id),
        productAPI.getByStore(id),
      ]);
      setStore(storeRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load store. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Store not found</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchData} className="btn btn-brand text-sm"><RefreshCw size={14} /> Retry</button>
            <Link to="/user/home" className="btn btn-ghost text-sm">← Back</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const isFood     = store.category === "Food";
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchCat    = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    // ── NEW: veg/non-veg filter (only relevant for food stores) ──
    const matchVeg =
      !isFood || vegFilter === "all"
        ? true
        : vegFilter === "veg"
        ? p.isVeg === true
        : p.isVeg === false;
    return matchCat && matchSearch && matchVeg;
  });

  const grouped = filtered.reduce((acc, p) => {
    const cat = activeCategory === "All" ? p.category : activeCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const grad  = CAT_GRADIENT[store.category] || CAT_GRADIENT.Other;
  const emoji = CAT_EMOJI[store.category] || "🏪";

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>

      {/* Store Hero */}
      <div className={`relative bg-gradient-to-br ${grad} pt-4 pb-16`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <Link to="/user/home"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft size={16} /> Back to stores
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-2xl"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              {store.image
                ? <img src={store.image} alt={store.name} className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => { e.target.style.display = "none"; e.target.parentNode.textContent = emoji; }} />
                : emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-white">{store.name}</h1>
                <span className={`tag text-xs ${store.isOpen ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  {store.isOpen ? "● Open" : "● Closed"}
                </span>
              </div>
              {store.description && (
                <p className="text-white/70 text-sm mt-1 line-clamp-2">{store.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {store.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-300 text-sm font-semibold">
                    <Star size={14} fill="currentColor" />
                    {store.rating.toFixed(1)} ({store.totalRatings?.toLocaleString() || 0})
                  </span>
                )}
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  <Clock size={13} /> {store.deliveryTime}
                </span>
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  <MapPin size={13} /> {store.address}
                </span>
              </div>
              {/* ── NEW: Favorite button in hero ── */}
              <div className="mt-3">
                <FavoriteButton storeId={store._id} variant="badge" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky meta + category strip */}
      <div className="sticky top-16 z-30 shadow-md"
        style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 py-3 overflow-x-auto scrollbar-hide">
            {[
              { icon: "🚚", label: "Free delivery" },
              { icon: "⏱️", label: store.deliveryTime },
              { icon: "💰", label: store.minOrder > 0 ? `Min ₹${store.minOrder}` : "No minimum" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs flex-shrink-0 font-medium"
                style={{ color: "var(--text-secondary)" }}>
                <span>{icon}</span><span>{label}</span>
                <span className="opacity-30">·</span>
              </div>
            ))}
            {store.phone && (
              <a href={`tel:${store.phone}`}
                className="flex items-center gap-1 text-xs font-semibold flex-shrink-0"
                style={{ color: "var(--brand)" }}>
                <Phone size={11} /> Call store
              </a>
            )}
          </div>

          {/* Category filter tabs */}
          {categories.length > 1 && (
            <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: activeCategory === cat ? "var(--brand)" : "var(--elevated)",
                    color:      activeCategory === cat ? "white"         : "var(--text-secondary)",
                    border: `1px solid ${activeCategory === cat ? "var(--brand)" : "var(--border)"}`,
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products section */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 pb-20">

        {/* Search + Veg filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={isFood ? `Search ${store.name}'s menu…` : "Search products…"}
            className="flex-1 min-w-[200px] max-w-md"
          />

          {/* ── NEW: Veg / Non-veg toggle (food stores only) ── */}
          {isFood && (
            <div className="flex items-center gap-1 p-1 rounded-xl flex-shrink-0"
              style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}>
              {VEG_OPTIONS.map(({ id, label, icon: Icon, color }) => {
                const active = vegFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setVegFilter(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: active
                        ? id === "veg"
                          ? "rgba(34,197,94,0.15)"
                          : id === "nonveg"
                          ? "rgba(239,68,68,0.12)"
                          : "var(--card)"
                        : "transparent",
                      color: active
                        ? id === "veg"
                          ? "#22c55e"
                          : id === "nonveg"
                          ? "#ef4444"
                          : "var(--text-primary)"
                        : "var(--text-muted)",
                      border: active
                        ? `1px solid ${
                            id === "veg"
                              ? "rgba(34,197,94,0.3)"
                              : id === "nonveg"
                              ? "rgba(239,68,68,0.25)"
                              : "var(--border)"
                          }`
                        : "1px solid transparent",
                    }}
                  >
                    {Icon && <Icon size={11} />}
                    {id === "veg" && "🟢 "}
                    {id === "nonveg" && "🔴 "}
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {!store.isOpen && (
          <div className="flex items-center gap-2 p-4 rounded-2xl mb-5 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={15} />
            This store is currently closed. You can browse but cannot place orders right now.
          </div>
        )}

        {products.length === 0 ? (
          <EmptyState
            icon={isFood ? "🍽️" : "📦"}
            title={`${store.name} hasn't added any ${isFood ? "menu items" : "products"} yet`}
            subtitle="Check back later!"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No items found"
            subtitle={
              vegFilter !== "all"
                ? `No ${vegFilter === "veg" ? "vegetarian" : "non-vegetarian"} items match your search`
                : "Try a different search or category"
            }
            action={
              <button onClick={() => { setSearch(""); setActiveCategory("All"); setVegFilter("all"); }} className="btn btn-brand text-sm">
                Clear filters
              </button>
            }
          />
        ) : (
          Object.entries(grouped).map(([cat, prods]) => (
            <div key={cat} className="mb-10">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>{cat}</h3>
                <span className="tag text-xs" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                  {prods.length}
                </span>
                {prods.some((p) => !p.available || p.stock === 0) && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                    {prods.filter((p) => !p.available || p.stock === 0).length} unavailable
                  </span>
                )}
                {isFood && (
                  <div className="flex items-center gap-2 ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>🟢 Veg</span><span>🔴 Non-veg</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
                {prods.map((p) => (
                  <ProductCard key={p._id} product={p} store={store} isFood={isFood} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}