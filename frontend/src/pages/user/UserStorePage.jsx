/**
 * UserStorePage — 100% Functionality Restored with Premium UI
 */
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Star, Clock, MapPin, Phone,
  AlertCircle, RefreshCw, Leaf, Flame, Search
} from "lucide-react";
import { storeAPI, productAPI, couponAPI } from "../../api/api";
import ProductCard from "../../components/store/ProductCard";
import FavoriteButton from "../../components/ui/FavoriteButton";
import { PageLoader, EmptyState } from "../../components/ui/Skeleton";

const CAT_EMOJI = {
  Groceries: "🛒", Food: "🍛", Snacks: "🍿",
  Beverages: "🧃", Medicines: "💊", Other: "🏪",
};

// Veg filter options
const VEG_OPTIONS = [
  { id: "all", label: "All", icon: null },
  { id: "veg", label: "Veg", icon: Leaf, color: "text-green-600" },
  { id: "nonveg", label: "Non-Veg", icon: Flame, color: "text-red-500" },
];

export default function UserStorePage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coupons, setCoupons] = useState([]);
  
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [vegFilter, setVegFilter] = useState("all"); 
  const [scrolled, setScrolled] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [storeRes, prodRes, couponRes] = await Promise.all([
        storeAPI.getById(id),
        productAPI.getByStore(id),
        couponAPI.list(id).catch(() => ({ data: [] })),
      ]);
      setStore(storeRes.data);
      setProducts(prodRes.data);
      setCoupons(couponRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load store. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Track scroll for sticky glass header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" >
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="font-display font-black tracking-tight text-2xl mb-2 text-[var(--text-primary)]">Store not found</h2>
          <p className="text-sm mb-6 text-[var(--text-muted)]">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchData} className="btn bg-[var(--text-primary)] text-[var(--surface)] text-sm active:scale-95 transition-all">
              <RefreshCw size={14} /> Retry
            </button>
            <Link to="/user/home" className="btn btn-ghost text-sm active:scale-95 transition-all">
              ← Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const isFood = store.category === "Food";
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchVeg = !isFood || vegFilter === "all" ? true : vegFilter === "veg" ? p.isVeg === true : p.isVeg === false;
    return matchCat && matchSearch && matchVeg;
  });

  const grouped = filtered.reduce((acc, p) => {
    const cat = activeCategory === "All" ? p.category : activeCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const emoji = CAT_EMOJI[store.category] || "🏪";

  return (
    <div className="min-h-screen page-enter pb-24" >
      
      {/* ── PREMIUM STORE HERO ── */}
      <div className="bg-[var(--surface)] pt-4 pb-6 px-4 lg:px-6 relative">
        <div className="max-w-7xl mx-auto">
          
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/user/home" className="inline-flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--brand)] transition-colors text-[13px] font-bold active:scale-95">
              <ArrowLeft size={16} /> Back
            </Link>
            <FavoriteButton storeId={store._id} variant="badge" />
          </div>

          {/* Store Info */}
          <div className="flex items-start gap-4 md:gap-6">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-4xl shrink-0 bg-[var(--elevated)] border border-[var(--border)] shadow-sm overflow-hidden">
              {store.image ? (
                <img src={store.image} alt={store.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; e.target.parentNode.textContent = emoji; }} />
              ) : emoji}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="font-display font-black tracking-tight text-2xl md:text-4xl text-[var(--text-primary)] leading-none">
                  {store.name}
                </h1>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${store.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {store.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              
              {store.description && (
                <p className="text-[var(--text-muted)] text-[13px] md:text-sm mt-1.5 line-clamp-2 max-w-xl font-medium">
                  {store.description}
                </p>
              )}
              
              <div className="flex items-center gap-1.5 md:gap-3 mt-3 flex-wrap text-[11px] md:text-xs font-bold text-[var(--text-secondary)]">
                {store.rating > 0 && (
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    <Star size={11} fill="currentColor" /> {store.rating.toFixed(1)} <span className="opacity-60 font-medium">({store.totalRatings?.toLocaleString()})</span>
                  </span>
                )}
                <span className="flex items-center gap-1 bg-[var(--elevated)] px-2 py-1 rounded-md"><MapPin size={12} /> {store.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY GLASS HEADER ── */}
      <div 
        className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? "bg-[var(--surface)]/90 backdrop-blur-xl border-b border-[var(--border)] shadow-sm pt-2" : "bg-[var(--surface)] border-b border-[var(--border)] pt-0"}`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          
          {/* Mini Header on scroll */}
          {scrolled && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)] animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <p className="font-black tracking-tight text-[15px] text-[var(--text-primary)]">{store.name}</p>
              </div>
            </div>
          )}

          {/* RESTORED: Quick Info & Contact Bar (Visible on Mobile & Desktop) */}
          <div className="flex items-center gap-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-[var(--border)] border-opacity-50">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-secondary)] shrink-0">
              <span className="text-base">🚚</span> Free delivery
            </span>
            <span className="opacity-30 text-[var(--border)]">|</span>
            <span className="flex items-center gap-1 text-[12px] font-bold text-[var(--text-secondary)] shrink-0">
              <Clock size={13} className="text-[var(--text-muted)]" /> {store.deliveryTime}
            </span>
            <span className="opacity-30 text-[var(--border)]">|</span>
            <span className="flex items-center gap-1 text-[12px] font-bold text-[var(--text-secondary)] shrink-0">
              💰 {store.minOrder > 0 ? `Min ₹${store.minOrder}` : "No minimum"}
            </span>
            {store.phone && (
              <>
                <span className="opacity-30 text-[var(--border)]">|</span>
                <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand)] shrink-0 hover:underline">
                  <Phone size={12} /> Call store
                </a>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 py-2.5">
            {/* Category Pills */}
            {categories.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-[13px] font-bold flex-shrink-0 transition-all duration-200 active:scale-95 ${
                      activeCategory === cat ? "bg-[var(--text-primary)] text-[var(--surface)] shadow-sm" : "bg-[var(--elevated)] text-[var(--text-secondary)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── STORE CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        
        {/* Closed Banner */}
        {!store.isOpen && (
          <div className="flex items-center gap-2 p-3 rounded-xl mb-6 text-[13px] font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
            <AlertCircle size={16} /> Store is currently closed. You cannot place orders right now.
          </div>
        )}

        {/* ── Store Offers / Coupons ── */}
        {coupons.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="section-header font-display font-bold text-[17px] text-[var(--text-primary)]">
                Available Offers
              </h2>
              <div className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--brand-dim)] text-[var(--brand)]">
                {coupons.length} active
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
              {coupons.map((coupon, i) => (
                <div
                  key={coupon._id}
                  className="flex-shrink-0 w-72 rounded-xl p-4 relative overflow-hidden"
                  style={{
                    background: i % 2 === 0 ? "linear-gradient(135deg, #10b981, #34d399)" : "linear-gradient(135deg, #8b5cf6, #a78bfa)",
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
                        {coupon.discountType === "free_delivery" ? "Free Delivery" : "Store Discount"}
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

        {/* Search & Native Segmented Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          
          <div className={`relative transition-all duration-300 ${isSearching ? "flex-1" : "w-full md:w-64"}`}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-[var(--text-muted)]" />
            </div>
            <input
              type="text"
              placeholder={`Search in ${store.name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(search.length > 0)}
              className="w-full bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none focus:bg-[var(--surface)] focus:border-[var(--brand)] transition-all shadow-sm"
            />
          </div>

          {isFood && (
            <div className="flex items-center p-1 rounded-xl bg-[var(--elevated)] border border-[var(--border)] w-fit shrink-0 shadow-inner">
              {VEG_OPTIONS.map(({ id, label, icon: Icon, color }) => {
                const active = vegFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setVegFilter(id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                      active ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {Icon && <Icon size={12} className={active ? color : "text-[var(--text-muted)]"} />}
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty States */}
        {products.length === 0 ? (
          <EmptyState icon={isFood ? "🍽️" : "📦"} title="Menu is empty" subtitle="This store hasn't added any items yet." />
        ) : filtered.length === 0 ? (
          <EmptyState 
            icon="🔍" 
            title="No items found" 
            subtitle="Try adjusting your search or filters."
            action={<button onClick={() => { setSearch(""); setActiveCategory("All"); setVegFilter("all"); }} className="btn bg-[var(--text-primary)] text-white text-sm">Clear filters</button>}
          />
        ) : (
          /* Grouped Product Grid */
          Object.entries(grouped).map(([cat, prods]) => (
            <div key={cat} className="mb-12">
              
              {/* RESTORED: Category Header with Unavailable Badges and Veg/NonVeg Legend */}
              <div className="flex items-center gap-3 mb-5 border-b border-[var(--border)] pb-2 flex-wrap">
                <h3 className="font-display font-black tracking-tight text-2xl text-[var(--text-primary)]">{cat}</h3>
                <span className="text-[11px] font-bold text-[var(--text-muted)] bg-[var(--elevated)] px-2 py-0.5 rounded-md">
                  {prods.length}
                </span>

                {prods.some((p) => !p.available || p.stock === 0) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 shadow-sm">
                    {prods.filter((p) => !p.available || p.stock === 0).length} unavailable
                  </span>
                )}

                {isFood && (
                  <div className="flex items-center gap-2 ml-auto text-[11px] font-bold text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><Leaf size={10} className="text-green-500" /> Veg</span>
                    <span className="flex items-center gap-1"><Flame size={10} className="text-red-500" /> Non-veg</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {prods.map((p, i) => (
                  <div key={p._id} style={{ animation: "slideUp 0.3s ease both", animationDelay: `${i * 30}ms` }}>
                    <ProductCard product={p} store={store} isFood={isFood} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}