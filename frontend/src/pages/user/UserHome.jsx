/**
 * UserHome — Enhanced with rich animations, interactive UI, and fun micro-interactions
 */
import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBasket, Utensils, Cookie, Coffee, Pill, Grid3X3,
  Zap, Clock, Shield, Star, ArrowRight, TrendingUp, RefreshCw,
  Search, Flame, MapPin, Sparkles
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { storeAPI } from "../../api/api";
import StoreCard from "../../components/StoreCard";
import SearchBar from "../../components/ui/SearchBar";
import { SkeletonCard, EmptyState } from "../../components/ui/Skeleton";

const CATEGORIES = [
  { name: "All",       icon: Grid3X3,        color: "#ff6b35", emoji: "🏪" },
  { name: "Groceries", icon: ShoppingBasket, color: "#22c55e", emoji: "🛒" },
  { name: "Food",      icon: Utensils,       color: "#f97316", emoji: "🍛" },
  { name: "Snacks",    icon: Cookie,         color: "#eab308", emoji: "🍕" },
  { name: "Beverages", icon: Coffee,         color: "#3b82f6", emoji: "🧃" },
  { name: "Medicines", icon: Pill,           color: "#ef4444", emoji: "💊" },
];

const FEATURES = [
  { icon: Zap,      label: "10-min delivery", sub: "Ultra fast",          color: "#f59e0b", emoji: "⚡" },
  { icon: Shield,   label: "100% safe",       sub: "Quality guaranteed",  color: "#22c55e", emoji: "🛡️" },
  { icon: Clock,    label: "24/7 open",       sub: "Always available",    color: "#3b82f6", emoji: "🕐" },
  { icon: Star,     label: "Top rated",       sub: "4.8+ rated stores",   color: "#a855f7", emoji: "⭐" },
];

const BANNERS = [
  {
    bg:    "from-orange-600 via-red-600 to-pink-700",
    title: "First Order FREE",
    sub:   "Use code QUICKFIRST at checkout",
    badge: "🎁 New user offer",
    emoji: "🎁",
    cta:   "Claim Now",
    link:  "/user/home",
  },
  {
    bg:    "from-purple-700 via-violet-600 to-indigo-700",
    title: "10 Min Delivery",
    sub:   "From 50+ local stores near you",
    badge: "⚡ Express",
    emoji: "🛵",
    cta:   "Order Now",
    link:  "/user/home",
  },
  {
    bg:    "from-teal-600 via-emerald-600 to-green-700",
    title: "Farm Fresh Daily",
    sub:   "Fresh groceries, delivered fast",
    badge: "🌿 Seasonal picks",
    emoji: "🥬",
    cta:   "Shop Fresh",
    link:  "/user/home",
  },
];

// Floating particle component
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
  const { user } = useAuth();
  const [stores,      setStores]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [category,    setCategory]    = useState("All");
  const [bannerIdx,   setBannerIdx]   = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search,      setSearch]      = useState("");
  const [hoveredCat,  setHoveredCat]  = useState(null);

  // Auto-rotate banners
  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search)              params.search   = search;
      if (category !== "All") params.category = category;
      const { data } = await storeAPI.getAll(params);
      setStores(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load stores.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const t = setTimeout(fetchStores, 150);
    return () => clearTimeout(t);
  }, [fetchStores]);

  const banner = BANNERS[bannerIdx];

  const greetings = ["Hey", "Hello", "Hi there,", "Welcome back,"];
  const greeting  = greetings[Math.floor(Date.now() / 86400000) % greetings.length];

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* ── Top greeting + search ── */}
        <div className="pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                <MapPin size={12} style={{ color: "var(--brand)" }} />
                Bengaluru, Karnataka
              </p>
              <h1 className="font-display font-bold text-3xl" style={{ color: "var(--text-primary)" }}>
                {greeting}{" "}
                <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                What are you craving today?
              </p>
            </div>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05))",
                border: "1px solid rgba(255,107,53,0.2)",
                animation: "heartbeat 3s infinite",
              }}
            >
              🛒
            </div>
          </div>

          {/* Search bar */}
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search for stores, food, groceries…"
            size="md"
            className="w-full"
          />
        </div>

        {/* ── Hero banner ── */}
        {!search && (
          <section className="py-3">
            <div
              className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${banner.bg}`}
              style={{ minHeight: 220 }}
            >
              {/* Floating emojis */}
              <FloatingEmoji emoji="✨" style={{ top: "10%", right: "15%" }} />
              <FloatingEmoji emoji="🌟" style={{ top: "60%", right: "30%" }} />
              <FloatingEmoji emoji="💫" style={{ top: "30%", right: "45%" }} />

              {/* Decorative circles */}
              <div
                className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.8), transparent)", transform: "translate(40%, -40%)" }}
              />
              <div
                className="absolute bottom-0 left-1/3 w-56 h-56 rounded-full opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(circle, white, transparent)", transform: "translateY(50%)" }}
              />

              <div className="relative z-10 p-8 flex items-center justify-between">
                <div className="flex-1">
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-bold mb-3 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white", backdropFilter: "blur(8px)" }}
                  >
                    {banner.badge}
                  </span>
                  <h2
                    className="font-display font-black text-4xl md:text-5xl text-white leading-tight mb-2"
                    style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
                  >
                    {banner.title}
                  </h2>
                  <p className="text-white/80 text-base mb-5">{banner.sub}</p>
                  <Link
                    to={banner.link}
                    className="inline-flex items-center gap-2 font-bold px-5 py-3 rounded-2xl text-sm"
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      color: "#1a1a22",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                      transition: "all 0.25s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  >
                    {banner.cta} <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Large emoji */}
                <div
                  className="hidden md:flex text-8xl flex-shrink-0"
                  style={{
                    filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.3))",
                    animation: "float 4s ease-in-out infinite",
                  }}
                >
                  {banner.emoji}
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex gap-2 justify-center mt-3">
              {BANNERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setBannerIdx(i)}
                  className="rounded-full transition-all duration-400"
                  style={{
                    width: i === bannerIdx ? 24 : 6,
                    height: 6,
                    background: i === bannerIdx ? "var(--brand)" : "var(--border)",
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Feature chips ── */}
        {!search && (
          <section className="py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FEATURES.map(({ icon: Icon, label, sub, color, emoji }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-4 rounded-2xl cursor-default group"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    transition: "all 0.3s ease",
                    animationDelay: `${i * 80}ms`,
                    animation: "slideUp 0.5s ease both",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color + "50";
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px ${color}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{
                      background: color + "15",
                      transition: "transform 0.3s ease",
                    }}
                  >
                    {emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
                      {label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Category pills ── */}
        <section className="py-3">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: "var(--text-primary)" }}>
            Browse by Category
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ name, icon: Icon, color, emoji }) => {
              const active = category === name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  onMouseEnter={() => setHoveredCat(name)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold flex-shrink-0 relative overflow-hidden"
                  style={{
                    background: active ? color : "var(--card)",
                    color:      active ? "white" : (hoveredCat === name ? color : "var(--text-secondary)"),
                    border: `1.5px solid ${active ? color : hoveredCat === name ? color + "60" : "var(--border)"}`,
                    boxShadow: active ? `0 4px 20px ${color}50` : "none",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: active ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: "1rem", transition: "transform 0.2s ease" }}>
                    {emoji}
                  </span>
                  {name}
                  {active && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Stores grid ── */}
        <section className="py-3 pb-20">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                {search ? `Results for "${search}"` :
                 category === "All" ? "All Stores" : `${category} Stores`}
              </h2>
              {!loading && !error && (
                <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Sparkles size={12} style={{ color: "var(--brand)" }} />
                  {stores.length} store{stores.length !== 1 ? "s" : ""} {search ? "found" : "near you"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStores}
                className="p-2.5 rounded-xl transition-all hover:scale-110"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
              {!search && (
                <div
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                >
                  <TrendingUp size={12} /> Top rated
                </div>
              )}
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div
              className="rounded-2xl p-5 mb-5 flex items-start gap-4"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <div className="text-2xl flex-shrink-0">⚠️</div>
              <div>
                <p className="font-bold text-sm" style={{ color: "#ef4444" }}>Connection Error</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{error}</p>
                <button onClick={fetchStores} className="text-xs font-semibold mt-2" style={{ color: "var(--brand)" }}>
                  Try again →
                </button>
              </div>
            </div>
          )}

          {/* Stores */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ animationDelay: `${i * 60}ms`, animation: "slideUp 0.5s ease both" }}>
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : stores.length === 0 && !error ? (
            <EmptyState
              icon="🏪"
              title="No stores found"
              subtitle={
                search ? `No stores match "${search}"` :
                category !== "All" ? `No ${category} stores available yet` :
                "No stores available. Check back soon!"
              }
              action={
                (search || category !== "All") ? (
                  <button
                    onClick={() => { setSearchInput(""); setCategory("All"); }}
                    className="btn btn-brand text-sm"
                  >
                    Clear filters
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stores.map((s, i) => (
                <div
                  key={s._id}
                  style={{ animation: "slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both", animationDelay: `${i * 60}ms` }}
                >
                  <StoreCard store={s} linkPrefix="/user/store" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}