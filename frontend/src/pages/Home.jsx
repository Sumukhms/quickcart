import { useState, useEffect } from "react";
import { Search, ShoppingBasket, Utensils, Cookie, Coffee, Pill, Grid } from "lucide-react";
import api from "../api/api";
import StoreCard from "../components/StoreCard";
import { PageLoader } from "../components/UI";

const CATEGORIES = [
  { name: "All", icon: Grid },
  { name: "Groceries", icon: ShoppingBasket },
  { name: "Food", icon: Utensils },
  { name: "Snacks", icon: Cookie },
  { name: "Beverages", icon: Coffee },
  { name: "Medicines", icon: Pill },
];

export default function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const t = setTimeout(() => fetchStores(), 300);
    return () => clearTimeout(t);
  }, [search, category]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category !== "All") params.category = category;
      const { data } = await api.get("/stores", { params });
      setStores(data);
    } catch { }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight">
          Groceries delivered<br />
          <span className="text-brand">in minutes.</span>
        </h1>
        <p className="text-muted mt-3 text-lg">Order from stores near you — fresh, fast, reliable.</p>

        {/* Search */}
        <div className="relative mt-6 max-w-lg">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-11 py-3.5 text-base"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => setCategory(name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              category === name
                ? "bg-brand border-brand text-white"
                : "bg-card border-border text-muted hover:border-brand/40 hover:text-white"
            }`}
          >
            <Icon size={15} />
            {name}
          </button>
        ))}
      </div>

      {/* Stores grid */}
      {loading ? (
        <PageLoader />
      ) : stores.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg">No stores found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <>
          <p className="text-muted text-sm mb-4">{stores.length} store{stores.length !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stores.map((s) => <StoreCard key={s._id} store={s} />)}
          </div>
        </>
      )}
    </div>
  );
}