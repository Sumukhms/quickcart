import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Clock, MapPin, Phone, Package, Search, ChevronRight } from "lucide-react";
import api from "../api/api";
import ProductCard from "../components/store/ProductCard";
import { SkeletonProductCard, PageLoader } from "../components/ui/Skeleton";

export default function StorePage() {
  const { id } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [storeRes, prodRes] = await Promise.all([
        api.get(`/stores/${id}`),
        api.get(`/products/store/${id}`)
      ]);
      setStore(storeRes.data);
      setProducts(prodRes.data);
      const cats = ["All", ...new Set(prodRes.data.map(p => p.category))];
      setCategories(cats);
    } catch {
      // Demo data
      setStore({
        _id: id,
        name: "FreshMart Express",
        category: "Groceries",
        address: "12, 3rd Main, Koramangala 5th Block, Bengaluru",
        phone: "+91 98765 43210",
        rating: 4.8,
        totalRatings: 2341,
        isOpen: true,
        deliveryTime: "12-18 min",
        minOrder: 99,
        image: "",
      });
      setProducts([
        { _id: "p1", name: "Amul Full Cream Milk", category: "Dairy", price: 28, originalPrice: 30, unit: "500ml", available: true, image: "" },
        { _id: "p2", name: "Bread Loaf - Brown", category: "Bakery", price: 45, unit: "400g", available: true, image: "" },
        { _id: "p3", name: "Tata Salt", category: "Staples", price: 22, originalPrice: 25, unit: "1kg", available: true, image: "" },
        { _id: "p4", name: "Fortune Refined Oil", category: "Staples", price: 145, unit: "1L", available: true, image: "" },
        { _id: "p5", name: "Parle-G Biscuits", category: "Snacks", price: 10, unit: "80g", available: true, image: "" },
        { _id: "p6", name: "Maggi Noodles", category: "Instant Food", price: 14, originalPrice: 15, unit: "75g", available: false, image: "" },
        { _id: "p7", name: "Eggs (Farm Fresh)", category: "Dairy", price: 90, unit: "12 pcs", available: true, image: "" },
        { _id: "p8", name: "Basmati Rice", category: "Staples", price: 120, unit: "1kg", available: true, image: "" },
        { _id: "p9", name: "Lipton Green Tea", category: "Beverages", price: 85, unit: "25 bags", available: true, image: "" },
        { _id: "p10", name: "Sprite Cold Drink", category: "Beverages", price: 45, unit: "750ml", available: true, image: "" },
        { _id: "p11", name: "Colgate Toothpaste", category: "Personal Care", price: 65, unit: "100g", available: true, image: "" },
        { _id: "p12", name: "Dove Soap", category: "Personal Care", price: 38, originalPrice: 45, unit: "75g", available: true, image: "" },
      ]);
      setCategories(["All", "Dairy", "Bakery", "Staples", "Snacks", "Instant Food", "Beverages", "Personal Care"]);
    } finally { setLoading(false); }
  };

  const filtered = products.filter(p => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = filtered.reduce((acc, p) => {
    const cat = activeCategory === "All" ? p.category : activeCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (loading) return <PageLoader />;
  if (!store) return null;

  const categoryGrad = {
    Groceries: "from-emerald-600 to-teal-700",
    Food: "from-orange-600 to-red-700",
    Snacks: "from-yellow-500 to-orange-600",
    Beverages: "from-blue-600 to-cyan-700",
    Medicines: "from-red-600 to-rose-700",
    Other: "from-purple-600 to-violet-700",
  };
  const grad = categoryGrad[store.category] || "from-gray-600 to-gray-700";

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      {/* Header */}
      <div className={`relative bg-gradient-to-r ${grad} pt-4 pb-16`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm font-medium">
            <ArrowLeft size={16} />
            Back to stores
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-2xl"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
              {store.category === "Groceries" ? "🛒" : store.category === "Food" ? "🍛" : store.category === "Medicines" ? "💊" : "🏪"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl md:text-3xl text-white">{store.name}</h1>
                <span className={`tag text-xs ${store.isOpen ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  {store.isOpen ? "● Open" : "● Closed"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-yellow-300 text-sm font-semibold">
                  <Star size={14} fill="currentColor" /> {store.rating?.toFixed(1)} ({store.totalRatings?.toLocaleString()} ratings)
                </span>
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

      {/* Sticky info strip */}
      <div className="sticky top-16 z-30 shadow-md"
        style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center gap-4 py-3 overflow-x-auto">
            {[
              { icon: "🚚", label: "Free delivery" },
              { icon: "⏱️", label: store.deliveryTime },
              { icon: "💰", label: store.minOrder > 0 ? `Min ₹${store.minOrder}` : "No min order" },
              { icon: "⭐", label: `${store.rating?.toFixed(1)} rating` },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs flex-shrink-0 font-medium"
                style={{ color: "var(--text-secondary)" }}>
                <span>{icon}</span>
                <span>{label}</span>
                <span className="opacity-30 last:hidden">·</span>
              </div>
            ))}
          </div>

          {/* Product categories */}
          <div className="flex gap-2 pb-3 overflow-x-auto">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all`}
                style={{
                  background: activeCategory === cat ? "var(--brand)" : "var(--elevated)",
                  color: activeCategory === cat ? "white" : "var(--text-secondary)",
                  border: "1px solid",
                  borderColor: activeCategory === cat ? "var(--brand)" : "var(--border)",
                }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 pb-20">
        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input className="input-theme pl-10 py-2.5 text-sm"
            placeholder={`Search in ${store.name}...`}
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Product groups */}
        {Object.entries(grouped).map(([cat, prods]) => (
          <div key={cat} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display font-bold text-lg" style={{ color: "var(--text-primary)" }}>{cat}</h3>
              <span className="tag text-xs" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                {prods.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 stagger">
              {prods.map(p => (
                <ProductCard key={p._id} product={p} store={store} />
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}