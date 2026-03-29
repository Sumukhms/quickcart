/**
 * StoreCard — UPDATED
 *
 * Changes:
 *   1. Added FavoriteButton (❤️) in the top-right of the banner
 *   2. All other UI unchanged
 */
import { Link }         from "react-router-dom";
import { Clock, ChevronRight, Zap } from "lucide-react";
import FavoriteButton   from "./ui/FavoriteButton";

const categoryEmojis = {
  Groceries: "🛒", Food: "🍛", Snacks: "🍕", Beverages: "🧃", Medicines: "💊", Other: "🏪"
};

const categoryGradients = {
  Groceries: "from-emerald-500 to-teal-600",
  Food:      "from-orange-500 to-red-500",
  Snacks:    "from-yellow-500 to-orange-500",
  Beverages: "from-blue-500 to-cyan-500",
  Medicines: "from-red-500 to-rose-600",
  Other:     "from-purple-500 to-violet-600",
};

export default function StoreCard({ store, linkPrefix = "/user/store" }) {
  const emoji    = categoryEmojis[store.category]    || "🏪";
  const gradient = categoryGradients[store.category] || "from-gray-500 to-gray-600";

  return (
    <Link to={`${linkPrefix}/${store._id}`}>
      <div className="card-hover relative overflow-hidden cursor-pointer group h-full"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>

        {/* Banner */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          <div className="text-5xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            {emoji}
          </div>

          {/* Status badge */}
          <div className={`absolute top-3 right-3 tag ${store.isOpen ? "tag-green" : "tag-red"}`}>
            {store.isOpen
              ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Open</>
              : "Closed"}
          </div>

          {/* Express badge */}
          {store.deliveryTime && store.deliveryTime.includes("10") && (
            <div className="absolute top-3 left-3 tag tag-brand">
              <Zap size={10} />10 min
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* ── NEW: Favorite button ── */}
          <div className="absolute bottom-3 right-3" onClick={(e) => e.preventDefault()}>
            <FavoriteButton storeId={store._id} size={15} />
          </div>
        </div>

        <div className="p-4">
          {/* Store info */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate group-hover:text-orange-400 transition-colors"
                style={{ color: "var(--text-primary)" }}>
                {store.name}
              </h3>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                {store.address}
              </p>
            </div>
            <ChevronRight size={16} className="flex-shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
              style={{ color: "var(--text-muted)" }} />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
              ⭐ {store.rating?.toFixed(1) || "4.5"}
              <span className="font-normal opacity-60">({store.totalRatings || 0})</span>
            </span>

            <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
              style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}>
              <Clock size={11} />
              {store.deliveryTime || "20-30 min"}
            </span>

            {store.minOrder > 0 && (
              <span className="text-xs px-2 py-1 rounded-lg"
                style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                Min ₹{store.minOrder}
              </span>
            )}
          </div>

          {/* Category tag */}
          <div className="mt-3 pt-3 border-t flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}>
            <span className="tag" style={{ background: "var(--elevated)", color: "var(--text-muted)", fontSize: "0.7rem" }}>
              {store.category}
            </span>
            <span className="text-xs" style={{ color: "var(--brand)" }}>
              Free delivery →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}