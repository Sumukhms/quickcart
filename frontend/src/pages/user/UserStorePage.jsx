import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Clock, MapPin, Phone, Search, AlertCircle } from "lucide-react";
import api from "../../api/api";
import ProductCard from "../../components/store/ProductCard";
import { SkeletonProductCard, PageLoader, EmptyState } from "../../components/ui/Skeleton";

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

export default function UserStorePage() {
  const { id } = useParams();
  const [store,    setStore]    = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [storeRes, prodRes] = await Promise.all([
        api.get(`/stores/${id}`),
        api.get(`/products/store/${id}`),
      ]);
      setStore(storeRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load store. Please try again.");
    } finally { setLoading(false); }
  };

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center max-w-sm">
          <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Store not found</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>{error}</p>
          <Link to="/user/home" className="btn btn-brand">← Back to Stores</Link>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const isFood = store.category === "Food";
  const categories = ["All", ...new Set(products.map(p => p.category))];

  const filtered = products.filter(p => {
    const matchCat    = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category when showing all
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
      <div className={`relative bg-gradient-to-r ${grad} pt-4 pb-16`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <Link to="/user/home"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft size={16} /> Back to stores
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-2xl"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              {store.image
                ? <img src={store.image} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
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
                <p className="text-white/70 text-sm mt-1">{store.description}</p>
              )}
              {isFood && store.cuisine && (
                <p className="text-white/60 text-xs mt-1">🍽️ {store.cuisine}</p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {store.rating > 0 && (
                  <span className="flex items-center gap-1 text-yellow-300 text-sm font-semibold">
                    <Star size={14} fill="currentColor" /> {store.rating.toFixed(1)} ({store.totalRatings} ratings)
                  </span>
                )}
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  <Clock size={13} /> {store.deliveryTime}
                </span>
                <span className="flex items-center gap-1 text-white/70 text-sm">
                  <MapPin size={13} /> {store.address}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky strip */}
      <div className="sticky top-16 z-30 shadow-md"
        style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 py-3 overflow-x-auto scrollbar-hide">
            {[
              { icon: "🚚", label: "Free delivery" },
              { icon: "⏱️", label: store.deliveryTime },
              { icon: "💰", label: store.minOrder > 0 ? `Min ₹${store.minOrder}` : "No min order" },
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

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
                  style={{
                    background: activeCategory === cat ? "var(--brand)" : "var(--elevated)",
                    color: activeCategory === cat ? "white" : "var(--text-secondary)",
                    border: `1px solid ${activeCategory === cat ? "var(--brand)" : "var(--border)"}`,
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 pb-20">
        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input-theme pl-10 py-2.5 text-sm"
            placeholder={isFood ? `Search ${store.name}'s menu…` : `Search in ${store.name}…`}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Closed notice */}
        {!store.isOpen && (
          <div className="flex items-center gap-2 p-4 rounded-2xl mb-5 text-sm"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle size={15} />
            This store is currently closed. You can browse the menu but cannot place orders right now.
          </div>
        )}

        {products.length === 0 ? (
          <EmptyState
            icon={isFood ? "🍽️" : "📦"}
            title={`${store.name} hasn't added any ${isFood ? "menu items" : "products"} yet`}
            subtitle="Check back later — they're still setting up!"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No items found"
            subtitle={`Try a different search or category`}
            action={
              <button onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="btn btn-brand text-sm">Clear filters</button>
            }
          />
        ) : (
          Object.entries(grouped).map(([cat, prods]) => (
            <div key={cat} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>{cat}</h3>
                <span className="tag text-xs" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                  {prods.length}
                </span>
                {isFood && (
                  <div className="flex items-center gap-2 ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>🟢 Veg</span>
                    <span>🔴 Non-veg</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
                {prods.map(p => (
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