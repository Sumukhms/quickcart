import { useState, useEffect } from "react";
import {
  ShoppingBasket, Utensils, Cookie, Coffee, Pill, Grid3X3,
  Zap, Clock, Shield, Star, ArrowRight, TrendingUp, AlertCircle, RefreshCw
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import StoreCard from "../../components/StoreCard";
import { SkeletonCard, EmptyState } from "../../components/ui/Skeleton";

const CATEGORIES = [
  { name: "All",       icon: Grid3X3,        color: "#ff6b35" },
  { name: "Groceries", icon: ShoppingBasket, color: "#22c55e" },
  { name: "Food",      icon: Utensils,       color: "#f97316" },
  { name: "Snacks",    icon: Cookie,         color: "#eab308" },
  { name: "Beverages", icon: Coffee,         color: "#3b82f6" },
  { name: "Medicines", icon: Pill,           color: "#ef4444" },
];

const FEATURES = [
  { icon: Zap,    label: "10-min delivery", sub: "Ultra fast",          color: "#f59e0b" },
  { icon: Shield, label: "100% safe",        sub: "Quality guaranteed",  color: "#22c55e" },
  { icon: Clock,  label: "24/7 open",        sub: "Always available",    color: "#3b82f6" },
  { icon: Star,   label: "Top rated",        sub: "4.8+ rated stores",   color: "#a855f7" },
];

const BANNERS = [
  { bg: "from-orange-600 via-red-600 to-pink-600",          title: "First order FREE",  sub: "Use code QUICKFIRST", badge: "🎁 New user offer",  emoji: "🎁" },
  { bg: "from-purple-600 via-violet-600 to-indigo-600",     title: "10 min delivery",   sub: "From 50+ local stores", badge: "⚡ Express",      emoji: "⚡" },
  { bg: "from-teal-600 via-emerald-600 to-green-600",       title: "Fresh groceries",   sub: "Farm to doorstep",    badge: "🌿 Fresh daily",    emoji: "🌿" },
];

export default function UserHome() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [category, setCategory] = useState("All");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchStores, 200);
    return () => clearTimeout(t);
  }, [category, searchQuery]);

  const fetchStores = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (category !== "All") params.category = category;
      const { data } = await api.get("/stores", { params });
      setStores(data);
    } catch (err) {
      setApiError(true);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const banner = BANNERS[bannerIdx];

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* Greeting */}
        <div className="pt-6 pb-2">
          <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>
            Hey {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>What would you like today?</p>
        </div>

        {/* Hero Banner */}
        <section className="py-3">
          <div
            className={`relative rounded-3xl overflow-hidden p-8 bg-gradient-to-r ${banner.bg} transition-all duration-700`}
            style={{ minHeight: 200 }}>
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none"
              style={{ background: "radial-gradient(circle, white, transparent)", transform: "translate(30%, -30%)" }} />
            <div className="relative z-10">
              <span className="inline-block tag text-xs mb-3 bg-white/20 text-white border-0">
                {banner.badge}
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight mb-2">
                {banner.title}
              </h2>
              <p className="text-white/80 text-base mb-4">{banner.sub}</p>
              <button
                className="btn text-sm font-bold px-5 py-2.5 rounded-xl text-white"
                style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                Claim Now <ArrowRight size={14} />
              </button>
            </div>
            <div className="absolute right-8 bottom-0 text-7xl opacity-70 hidden md:block"
              style={{ animation: "float 4s ease-in-out infinite" }}>
              {banner.emoji}
            </div>
          </div>
          <div className="flex gap-1.5 justify-center mt-3">
            {BANNERS.map((_, i) => (
              <button key={i} onClick={() => setBannerIdx(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: i === bannerIdx ? 20 : 6, height: 6, background: i === bannerIdx ? "var(--brand)" : "var(--border)" }} />
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map(({ icon: Icon, label, sub, color }) => (
              <div key={label}
                className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-1"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + "15" }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="py-3">
          <h2 className="font-display font-bold text-xl mb-3" style={{ color: "var(--text-primary)" }}>Browse</h2>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ name, icon: Icon, color }) => {
              const active = category === name;
              return (
                <button key={name} onClick={() => setCategory(name)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:scale-105"
                  style={{
                    background: active ? color : "var(--card)",
                    color: active ? "white" : "var(--text-secondary)",
                    border: `1.5px solid ${active ? color : "var(--border)"}`,
                    boxShadow: active ? `0 4px 16px ${color}44` : "none",
                  }}>
                  <Icon size={16} style={{ color: active ? "white" : color }} />
                  {name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Stores */}
        <section className="py-3 pb-16">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl" style={{ color: "var(--text-primary)" }}>
                {searchQuery ? `"${searchQuery}"` : category === "All" ? "All Stores" : category}
              </h2>
              {!loading && !apiError && (
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {stores.length} store{stores.length !== 1 ? "s" : ""} nearby
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {apiError && (
                <button onClick={fetchStores}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)" }}>
                  <RefreshCw size={12} /> Retry
                </button>
              )}
              <button className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--brand)" }}>
                <TrendingUp size={15} /> Top rated
              </button>
            </div>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="rounded-2xl p-5 mb-5 flex items-center gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertCircle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
              <div>
                <p className="font-bold text-sm" style={{ color: "#ef4444" }}>Connection error</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Could not reach the server. Make sure the backend is running on port 5000.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : stores.length === 0 && !apiError ? (
            <EmptyState
              icon="🏪"
              title="No stores found"
              subtitle={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : category !== "All"
                  ? `No ${category} stores in your area yet`
                  : "No stores have been created yet. Store owners can sign up and create their store."
              }
              action={
                category !== "All" ? (
                  <button onClick={() => setCategory("All")} className="btn btn-brand text-sm">
                    Browse all stores
                  </button>
                ) : null
              }
            />
          ) : !apiError && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {stores.map(s => <StoreCard key={s._id} store={s} linkPrefix="/user/store" />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}