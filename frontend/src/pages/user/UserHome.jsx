/**
 * UserHome — Refactored to Premium App Standards
 */
import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBasket, Utensils, Cookie, Coffee, Pill, Grid3X3,
  Zap, TrendingUp, RefreshCw, MapPin, Sparkles, Heart, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoriteContext";
import { productAPI, statsAPI } from "../../api/api";
import StoreCard from "../../components/StoreCard";
import SearchBar from "../../components/ui/SearchBar";
import { SkeletonCard, EmptyState } from "../../components/ui/Skeleton";
import { useStores } from "../../hooks/useStores";

const CATEGORIES = [
  { name: "All", icon: Grid3X3, emoji: "🏪" },
  { name: "Groceries", icon: ShoppingBasket, emoji: "🛒" },
  { name: "Food", icon: Utensils, emoji: "🍛" },
  { name: "Snacks", icon: Cookie, emoji: "🍕" },
  { name: "Beverages", icon: Coffee, emoji: "🧃" },
  { name: "Medicines", icon: Pill, emoji: "💊" },
];

const GREETINGS = ["Hey", "Hello", "Hi there,", "Welcome back,"];

// Premium Naked UI list item
function ProductSearchCard({ product }) {
  const store = product.storeId;
  return (
    <Link
      to={`/user/store/${store?._id || product.storeId}`}
      className="flex items-center gap-4 py-4 px-2 border-b border-[var(--border)] transition-all duration-200 hover:bg-[var(--hover)] active:scale-[0.98] group"
    >
      <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden bg-[var(--elevated)] flex items-center justify-center text-2xl">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : store?.category === "Food" ? "🍽️" : "🛍️"}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-bold text-[15px] text-[var(--text-primary)] leading-tight truncate">
              {product.name}
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">
              {store?.name || "Store"} • {product.category} {product.unit ? `• ${product.unit}` : ""}
            </p>
          </div>
          
          <div className="flex flex-col items-end shrink-0">
            <span className="font-black text-sm text-[var(--text-primary)]">
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] line-through text-[var(--text-muted)]">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${store?.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {store?.isOpen ? "Open" : "Closed"}
          </span>
          {store?.category === "Food" && (
            <span className="text-[10px]">{product.isVeg ? "🟢 Veg" : "🔴 Non-veg"}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function FloatingEmoji({ emoji, style }) {
  return (
    <div
      className="absolute pointer-events-none select-none text-2xl opacity-20"
      style={{
        animation: `floatSlow ${4 + Math.random() * 4}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 3}s`,
        ...style,
      }}
    >
      {emoji}
    </div>
  );
}

export default function UserHome() {
  const { user, isCustomer } = useAuth();
  const { favorites } = useFavorites();

  const {
    data: stores,
    loading,
    error,
    search,
    setSearch,
    category,
    setCategory,
    refresh: fetchStores,
  } = useStores();

  const [bannerIdx, setBannerIdx] = useState(0);
  const [favOnly, setFavOnly] = useState(false);
  const [itemResults, setItemResults] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTab, setSearchTab] = useState("stores");
  const [homeStats, setHomeStats] = useState(null);

  useEffect(() => {
    statsAPI.getHome().then((r) => setHomeStats(r.data)).catch(() => {});
  }, []);

  const BANNERS = homeStats?.banners || [
    { key: "offer", title: "First Order FREE", sub: "Use code QUICKFIRST at checkout", badge: "New user offer", emoji: "🎁", cta: "Claim Now", bg: "from-orange-600 to-red-600", link: "/user/home" },
    { key: "speed", title: "10 Min Delivery", sub: "From 50+ local stores near you", badge: "Express", emoji: "🛵", cta: "Order Now", bg: "from-indigo-600 to-purple-700", link: "/user/home" },
    { key: "fresh", title: "Farm Fresh Daily", sub: "Fresh groceries, delivered fast", badge: "Seasonal picks", emoji: "🥬", cta: "Shop Fresh", bg: "from-emerald-600 to-teal-700", link: "/user/home" },
  ];

  const FEATURES = homeStats?.features || [
    { key: "delivery", stat: "10 min", label: "Avg Delivery", emoji: "⚡", bg: "bg-amber-100", text: "text-amber-700" },
    { key: "safe", stat: "100%", label: "Quality Safe", emoji: "🛡️", bg: "bg-green-100", text: "text-green-700" },
    { key: "stores", stat: "50+", label: "Open Stores", emoji: "🏪", bg: "bg-blue-100", text: "text-blue-700" },
    { key: "rating", stat: "4.8★", label: "Avg Rating", emoji: "⭐", bg: "bg-purple-100", text: "text-purple-700" },
  ];

  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, [BANNERS.length]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setItemResults([]);
      setSearchTab("stores");
      return;
    }
    setItemLoading(true);
    productAPI.search(debouncedSearch)
      .then((r) => setItemResults(r.data || []))
      .catch(() => setItemResults([]))
      .finally(() => setItemLoading(false));
  }, [debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f._id)), [favorites]);
  const displayedStores = favOnly ? stores.filter((s) => favoriteIds.has(s._id)) : stores;
  const banner = BANNERS[bannerIdx];
  const greeting = GREETINGS[Math.floor(Date.now() / 86400000) % GREETINGS.length];
  const isSearching = search.length >= 2;

  return (
    <div className="min-h-screen page-enter pb-24" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        
        {/* Header */}
        <div className="pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-[var(--brand)]">
                <MapPin size={12} /> Bengaluru, Karnataka
              </p>
              <h1 className="font-display font-black tracking-tight text-3xl text-[var(--text-primary)]">
                {greeting} <span className="text-[var(--brand)]">{user?.name?.split(" ")[0]}</span> 👋
              </h1>
            </div>
          </div>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search for restaurants, groceries, medicines..."
            size="md"
            className="w-full shadow-sm"
          />
        </div>

        {/* Search Results */}
        {isSearching && (
          <section className="py-3">
            <div className="flex gap-2 mb-4 bg-[var(--elevated)] p-1 rounded-xl w-fit">
              {[
                { id: "stores", label: "Stores", count: stores.length },
                { id: "items", label: "Items", count: itemResults.length },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setSearchTab(id)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200 active:scale-95 ${
                    searchTab === id ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {label} <span className="ml-1 opacity-50">{id === "items" && itemLoading ? "…" : count}</span>
                </button>
              ))}
            </div>

            {searchTab === "stores" && (
              loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : stores.length === 0 ? (
                <EmptyState icon="🏪" title="No stores found" subtitle={`No stores match "${search}"`} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {stores.map((s, i) => (
                    <div key={s._id} style={{ animation: "slideUp 0.3s ease both", animationDelay: `${i * 30}ms` }}>
                      <StoreCard store={s} linkPrefix="/user/store" />
                    </div>
                  ))}
                </div>
              )
            )}

            {searchTab === "items" && (
              itemLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer bg-[var(--card)]" />)}
                </div>
              ) : itemResults.length === 0 ? (
                <EmptyState icon="🛍️" title="No items found" subtitle={`No products match "${search}".`} />
              ) : (
                <div className="bg-[var(--card)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
                  {itemResults.map((p, i) => (
                    <div key={p._id} style={{ animation: "slideUp 0.3s ease both", animationDelay: `${i * 30}ms` }}>
                      <ProductSearchCard product={p} />
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}

        {/* Default View */}
        {!isSearching && (
          <>
            {/* Clean Hero Banner */}
            <section className="py-3">
              <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${banner.bg} shadow-sm`} style={{ minHeight: 180 }}>
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <div className="relative z-10 p-6 md:p-8 flex items-center justify-between">
                  <div className="flex-1 max-w-sm">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mb-3 px-2 py-1 rounded-md bg-white/20 text-white backdrop-blur-sm">
                      {banner.badge}
                    </span>
                    <h2 className="font-display font-black tracking-tight text-3xl md:text-4xl text-white leading-none mb-2">
                      {banner.title}
                    </h2>
                    <p className="text-white/90 text-sm mb-5 font-medium">
                      {banner.sub}
                    </p>
                    <Link
                      to={banner.link}
                      className="inline-flex items-center gap-1.5 font-bold px-5 py-2.5 rounded-xl text-sm bg-white text-gray-900 shadow-sm transition-all duration-200 active:scale-95 hover:bg-gray-50"
                    >
                      {banner.cta} <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="hidden md:flex text-7xl opacity-90 drop-shadow-md">
                    {banner.emoji}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 justify-center mt-3">
                {BANNERS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIdx(i)}
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === bannerIdx ? 16 : 6, height: 6, background: i === bannerIdx ? "var(--text-primary)" : "var(--border)" }}
                  />
                ))}
              </div>
            </section>

            {/* Flat Feature Chips */}
            <section className="py-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {FEATURES.map(({ key, stat, label, emoji, bg, text }, i) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--card)] shadow-sm border border-[var(--border)] transition-colors hover:bg-[var(--hover)]"
                    style={{ animation: "slideUp 0.3s ease both", animationDelay: `${i * 50}ms` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${bg}`}>
                      {emoji}
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight text-[var(--text-primary)] leading-none">{stat}</p>
                      <p className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* High-Contrast Category Pills */}
            <section className="py-3 mt-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-black tracking-tight text-xl text-[var(--text-primary)]">
                  Explore
                </h2>
                {isCustomer && favorites.length > 0 && (
                  <button
                    onClick={() => setFavOnly((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95 ${
                      favOnly ? "bg-red-100 text-red-600" : "bg-[var(--elevated)] text-[var(--text-secondary)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <Heart size={12} fill={favOnly ? "currentColor" : "none"} />
                    {favOnly ? "Saved" : "Show Saved"}
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map(({ name, emoji }) => {
                  const active = category === name;
                  return (
                    <button
                      key={name}
                      onClick={() => { setCategory(name); setFavOnly(false); }}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all duration-200 active:scale-95 ${
                        active 
                          ? "bg-[var(--text-primary)] text-[var(--surface)] shadow-md" 
                          : "bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-muted)]"
                      }`}
                    >
                      <span className="text-lg leading-none">{emoji}</span>
                      {name}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Stores Grid */}
            <section className="py-3">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-black tracking-tight text-xl text-[var(--text-primary)]">
                  {favOnly ? "Saved Stores" : category === "All" ? "All Stores" : `${category} Stores`}
                  {!loading && !error && (
                    <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">({displayedStores.length})</span>
                  )}
                </h2>
                
                <div className="flex items-center gap-2">
                  <button onClick={fetchStores} className="p-2 rounded-lg bg-[var(--elevated)] text-[var(--text-secondary)] hover:bg-[var(--hover)] transition-all active:scale-95">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : displayedStores.length === 0 && !error ? (
                <EmptyState
                  icon={favOnly ? "❤️" : "🏪"}
                  title={favOnly ? "No saved stores" : "No stores found"}
                  subtitle={favOnly ? "Save your favorite places first." : "Try a different category."}
                  action={
                    (favOnly || category !== "All") && (
                      <button onClick={() => { setFavOnly(false); setCategory("All"); }} className="btn bg-[var(--text-primary)] text-white text-sm">
                        Clear Filters
                      </button>
                    )
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedStores.map((s, i) => (
                    <div key={s._id} style={{ animation: "slideUp 0.4s ease both", animationDelay: `${i * 40}ms` }}>
                      <StoreCard store={s} linkPrefix="/user/store" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}