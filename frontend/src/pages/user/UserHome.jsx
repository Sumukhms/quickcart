/**
 * UserHome — Production commerce homepage, Blinkit/Zepto style
 */
import { useState, useEffect, useMemo } from "react";
import {
  ShoppingBasket,
  Utensils,
  Cookie,
  Coffee,
  Pill,
  Grid3X3,
  RefreshCw,
  Heart,
  Clock,
  Shield,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFavorites } from "../../context/FavoriteContext";
import { productAPI, couponAPI } from "../../api/api";
import StoreCard from "../../components/StoreCard";
import SearchBar from "../../components/ui/SearchBar";
import { SkeletonCard, EmptyState } from "../../components/ui/Skeleton";
import { useStores } from "../../hooks/useStores";

/* ── Category definitions ── */
const CATEGORIES = [
  { name: "All",       icon: Grid3X3,       emoji: "🏪" },
  { name: "Groceries", icon: ShoppingBasket, emoji: "🛒" },
  { name: "Food",      icon: Utensils,       emoji: "🍛" },
  { name: "Snacks",    icon: Cookie,         emoji: "🍕" },
  { name: "Beverages", icon: Coffee,         emoji: "🧃" },
  { name: "Medicines", icon: Pill,           emoji: "💊" },
];

const categoryActiveStyle = {
  All:       { bg: "var(--text-primary)", color: "var(--surface)" },
  Groceries: { bg: "#16a34a",             color: "#fff"            },
  Food:      { bg: "#ea580c",             color: "#fff"            },
  Snacks:    { bg: "#ca8a04",             color: "#fff"            },
  Beverages: { bg: "#2563eb",             color: "#fff"            },
  Medicines: { bg: "#dc2626",             color: "#fff"            },
};

/* ── Product search result row ── */
function ProductSearchRow({ product }) {
  const store = product.storeId;
  return (
    <Link
      to={`/user/store/${store?._id || product.storeId}`}
      className="flex items-center gap-3.5 px-4 py-3 transition-colors hover:bg-[var(--hover)] active:bg-[var(--elevated)]"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {/* Thumbnail */}
      <div
        className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl"
        style={{ background: "var(--elevated)" }}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.target.style.display = "none")}
          />
        ) : store?.category === "Food" ? "🍽️" : "🛍️"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4
          className="font-semibold text-[14px] truncate leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </h4>
        <p
          className="text-[12px] truncate mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {store?.name || "Store"}
          {product.unit ? ` · ${product.unit}` : ""}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              background: store?.isOpen ? "var(--green-bg)" : "var(--red-bg)",
              color: store?.isOpen ? "var(--green)" : "var(--red)",
            }}
          >
            {store?.isOpen ? "Open" : "Closed"}
          </span>
          {store?.category === "Food" && (
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {product.isVeg ? "🟢 Veg" : "🔴 Non-veg"}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p
          className="font-bold text-[14px] leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          ₹{product.price}
        </p>
        {product.originalPrice && product.originalPrice > product.price && (
          <p
            className="text-[11px] line-through mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            ₹{product.originalPrice}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ── Hero image sets ── */
const HERO_IMAGES = [
  "/images/hero-food.png",
  "/images/hero-groceries.png",
];

export default function UserHome() {
  const { isCustomer } = useAuth();
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

  const [favOnly, setFavOnly] = useState(false);
  const [itemResults, setItemResults] = useState([]);
  const [itemLoading, setItemLoading] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTab, setSearchTab] = useState("stores");
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    couponAPI.list().then((r) => setCoupons(r.data)).catch(() => {});
  }, []);

  // Product search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setItemResults([]);
      setSearchTab("stores");
      return;
    }
    setItemLoading(true);
    productAPI
      .search(debouncedSearch)
      .then((r) => setItemResults(r.data || []))
      .catch(() => setItemResults([]))
      .finally(() => setItemLoading(false));
  }, [debouncedSearch]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f._id)),
    [favorites]
  );
  const displayedStores = favOnly
    ? stores.filter((s) => favoriteIds.has(s._id))
    : stores;

  const isSearching = search.length >= 2;

  // Pick hero image based on hour (food at meal times, groceries otherwise)
  const heroHour = new Date().getHours();
  const heroImg = (heroHour >= 11 && heroHour <= 14) || (heroHour >= 18 && heroHour <= 21)
    ? HERO_IMAGES[0]
    : HERO_IMAGES[1];

  /* ─────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen page-enter pb-24"
      
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* ══════════════════════════════════════════════
            HERO — Cinematic split layout
            ══════════════════════════════════════════════ */}
        <div
          className="rounded-2xl mt-4 mb-6 overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="flex flex-col lg:flex-row">

            {/* ── Left: Content ── */}
            <div className="flex-1 flex flex-col justify-center px-6 py-7 lg:px-10 lg:py-10 order-2 lg:order-1">
              {/* Location pill */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit mb-4"
                style={{
                  background: "var(--green-bg)",
                  color: "var(--green)",
                  border: "1px solid rgba(22,163,74,0.18)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--green)", animation: "pulseDot 2s infinite" }}
                />
                Delivering to Bengaluru
              </div>

              {/* Headline */}
              <h1
                className="font-display font-extrabold text-[28px] md:text-[34px] lg:text-[38px] leading-[1.15] tracking-tight mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Groceries, food &{" "}
                <span style={{ color: "var(--brand)" }}>
                  more
                </span>
                <br className="hidden sm:block" />
                {" "}delivered in{" "}
                <span
                  className="inline-flex items-center"
                  style={{ color: "var(--brand)" }}
                >
                  minutes
                </span>
              </h1>

              <p
                className="text-[15px] leading-relaxed mb-6 max-w-md"
                style={{ color: "var(--text-muted)" }}
              >
                Order from {stores.length > 0 ? `${stores.length}+` : "your favorite"} local stores.
                Fresh groceries, hot meals, medicines — anything you need, at your doorstep.
              </p>

              {/* Search bar */}
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search for stores, groceries, medicines…"
                size="lg"
                className="w-full max-w-lg mb-5"
              />

              {/* Trust indicators — inline, not 4 boxes */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} style={{ color: "var(--brand)" }} />
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    10 min
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    delivery
                  </span>
                </div>
                <div
                  className="w-px h-4"
                  style={{ background: "var(--border)" }}
                />
                <div className="flex items-center gap-1.5">
                  <Star size={14} style={{ color: "#d97706" }} />
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    4.8
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    avg. rating
                  </span>
                </div>
                <div
                  className="w-px h-4"
                  style={{ background: "var(--border)" }}
                />
                <div className="flex items-center gap-1.5">
                  <Shield size={14} style={{ color: "var(--green)" }} />
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    100%
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    safe & fresh
                  </span>
                </div>
              </div>
            </div>

            {/* ── Right: Cinematic photo ── */}
            <div className="lg:w-[46%] relative order-1 lg:order-2">
              <div className="relative h-52 sm:h-60 lg:h-full lg:min-h-[360px]">
                <img
                  src={heroImg}
                  alt="Fresh food and groceries"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Gradient fade on left edge (desktop) for smooth blend into content */}
                <div
                  className="absolute inset-0 pointer-events-none hidden lg:block"
                  style={{
                    background: "linear-gradient(to right, var(--surface) 0%, transparent 25%)",
                  }}
                />
                {/* Gradient fade on bottom edge (mobile) */}
                <div
                  className="absolute inset-0 pointer-events-none lg:hidden"
                  style={{
                    background: "linear-gradient(to top, var(--surface) 0%, transparent 40%)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            SEARCH RESULTS
            ══════════════════════════════════════════════ */}
        {isSearching && (
          <section className="pb-4">
            {/* Search tab switcher */}
            <div
              className="flex gap-1 mb-4 p-1 rounded-lg w-fit"
              style={{ background: "var(--elevated)" }}
            >
              {[
                { id: "stores", label: "Stores", count: stores.length },
                { id: "items",  label: "Items",  count: itemResults.length },
              ].map(({ id, label, count }) => (
                <button
                  key={id}
                  onClick={() => setSearchTab(id)}
                  className="px-4 py-1.5 rounded-md text-[13px] font-bold transition-all duration-150"
                  style={{
                    background: searchTab === id ? "var(--surface)" : "transparent",
                    color: searchTab === id ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow: searchTab === id ? "var(--shadow-xs)" : "none",
                  }}
                >
                  {label}
                  <span
                    className="ml-1.5 text-[11px] font-normal"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {id === "items" && itemLoading ? "…" : count}
                  </span>
                </button>
              ))}
            </div>

            {/* Store results */}
            {searchTab === "stores" &&
              (loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : stores.length === 0 ? (
                <EmptyState
                  icon="🏪"
                  title="No stores found"
                  subtitle={`No stores match "${search}"`}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((s, i) => (
                    <div
                      key={s._id}
                      style={{ animation: "slideUp 0.25s ease both", animationDelay: `${i * 30}ms` }}
                    >
                      <StoreCard store={s} linkPrefix="/user/store" />
                    </div>
                  ))}
                </div>
              ))}

            {/* Item results */}
            {searchTab === "items" &&
              (itemLoading ? (
                <div className="space-y-0 rounded-xl overflow-hidden card">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 shimmer" style={{ borderBottom: "1px solid var(--border)" }} />
                  ))}
                </div>
              ) : itemResults.length === 0 ? (
                <EmptyState
                  icon="🛍️"
                  title="No items found"
                  subtitle={`No products match "${search}"`}
                />
              ) : (
                <div className="rounded-xl overflow-hidden card">
                  {itemResults.map((p, i) => (
                    <div
                      key={p._id}
                      style={{ animation: "slideUp 0.25s ease both", animationDelay: `${i * 30}ms` }}
                    >
                      <ProductSearchRow product={p} />
                    </div>
                  ))}
                </div>
              ))}
          </section>
        )}

        {/* ══════════════════════════════════════════════
            DEFAULT BROWSE VIEW
            ══════════════════════════════════════════════ */}
        {!isSearching && (
          <>
            {/* ── Active Offers / Coupons ── */}
            {coupons.length > 0 && (
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h2
                    className="section-header font-display font-bold text-[17px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Active Offers
                  </h2>
                  <div className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ background: "var(--brand-dim)", color: "var(--brand)" }}>
                    {coupons.length} available
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {coupons.map((coupon, i) => (
                    <div
                      key={coupon._id}
                      className="flex-shrink-0 w-72 rounded-xl p-4 relative overflow-hidden"
                      style={{
                        background: i % 2 === 0 ? "linear-gradient(135deg, #ff6b35, #ff8c5a)" : "linear-gradient(135deg, #3b82f6, #60a5fa)",
                        boxShadow: "var(--shadow-sm)",
                        animation: "slideUp 0.3s ease both",
                        animationDelay: `${i * 50}ms`,
                      }}
                    >
                      {/* Decorative shapes */}
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white opacity-10 pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white opacity-10 pointer-events-none" />
                      
                      <div className="relative z-10 text-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-widest opacity-90">
                            {coupon.discountType === "free_delivery" ? "Free Delivery" : "Special Discount"}
                          </span>
                          <span className="font-mono font-bold px-2 py-1 bg-white/20 rounded text-[12px] tracking-widest backdrop-blur-sm">
                            {coupon.code}
                          </span>
                        </div>
                        <h3 className="font-display font-extrabold text-[20px] leading-tight mb-1">
                          {coupon.discountType === "percent" && `${coupon.discountValue}% OFF`}
                          {coupon.discountType === "flat" && `₹${coupon.discountValue} OFF`}
                          {coupon.discountType === "free_delivery" && "FREE DELIVERY"}
                        </h3>
                        <p className="text-[12px] opacity-90 truncate">
                          {coupon.description || `Use code ${coupon.code} at checkout`}
                        </p>
                        {coupon.minOrderAmount > 0 && (
                          <div className="text-[10px] mt-2 opacity-80">
                            *Min. order ₹{coupon.minOrderAmount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Category pills ── */}
            <section className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="section-header font-display font-bold text-[17px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  Browse
                </h2>
                {isCustomer && favorites.length > 0 && (
                  <button
                    onClick={() => setFavOnly((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-150 active:scale-95"
                    style={{
                      background: favOnly ? "var(--red-bg)" : "var(--elevated)",
                      color: favOnly ? "var(--red)" : "var(--text-secondary)",
                      border: `1px solid ${favOnly ? "rgba(220,38,38,0.20)" : "var(--border)"}`,
                    }}
                  >
                    <Heart size={12} fill={favOnly ? "currentColor" : "none"} />
                    {favOnly ? "Saved stores" : "Saved"}
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map(({ name, emoji }) => {
                  const active = category === name;
                  const activeStyle = categoryActiveStyle[name] || {};
                  return (
                    <button
                      key={name}
                      onClick={() => { setCategory(name); setFavOnly(false); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold shrink-0 transition-all duration-150 active:scale-95"
                      style={{
                        background: active ? (activeStyle.bg || "var(--text-primary)") : "var(--card)",
                        color: active ? (activeStyle.color || "var(--surface)") : "var(--text-secondary)",
                        border: active ? "1.5px solid transparent" : "1.5px solid var(--border)",
                        boxShadow: active ? "var(--shadow-sm)" : "none",
                      }}
                    >
                      <span className="text-[17px] leading-none">{emoji}</span>
                      {name}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Stores grid ── */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="section-header font-display font-bold text-[17px]"
                  style={{ color: "var(--text-primary)" }}
                >
                  {favOnly
                    ? "Saved Stores"
                    : category === "All"
                      ? "All Stores"
                      : `${category} Stores`}
                  {!loading && !error && (
                    <span
                      className="ml-2 text-[13px] font-normal"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ({displayedStores.length})
                    </span>
                  )}
                </h2>

                <button
                  onClick={fetchStores}
                  className="p-2 rounded-lg transition-all active:scale-95 hover:bg-[var(--hover)]"
                  style={{
                    background: "var(--elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                  title="Refresh"
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : displayedStores.length === 0 && !error ? (
                <EmptyState
                  icon={favOnly ? "❤️" : "🏪"}
                  title={favOnly ? "No saved stores" : "No stores here"}
                  subtitle={
                    favOnly
                      ? "Tap the heart on any store to save it."
                      : "Try a different category or check back later."
                  }
                  action={
                    (favOnly || category !== "All") && (
                      <button
                        onClick={() => { setFavOnly(false); setCategory("All"); }}
                        className="btn btn-secondary text-sm"
                      >
                        Clear filters
                      </button>
                    )
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedStores.map((s, i) => (
                    <div
                      key={s._id}
                      style={{
                        animation: "slideUp 0.3s ease both",
                        animationDelay: `${Math.min(i * 35, 200)}ms`,
                      }}
                    >
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

