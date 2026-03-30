/**
 * StoreCard — Enhanced with animations, micro-interactions, and visual polish
 */
import { Link }         from "react-router-dom";
import { Clock, ChevronRight, Zap, Star, TrendingUp } from "lucide-react";
import FavoriteButton   from "./ui/FavoriteButton";

const categoryEmojis = {
  Groceries: "🛒", Food: "🍛", Snacks: "🍕", Beverages: "🧃", Medicines: "💊", Other: "🏪"
};

const categoryGradients = {
  Groceries: "from-emerald-500 via-teal-600 to-cyan-700",
  Food:      "from-orange-500 via-red-500 to-rose-600",
  Snacks:    "from-yellow-500 via-orange-500 to-amber-600",
  Beverages: "from-blue-500 via-cyan-500 to-sky-600",
  Medicines: "from-red-500 via-rose-600 to-pink-700",
  Other:     "from-purple-500 via-violet-600 to-indigo-700",
};

const categoryColors = {
  Groceries: "#22c55e", Food: "#f97316", Snacks: "#eab308",
  Beverages: "#3b82f6", Medicines: "#ef4444", Other: "#8b5cf6",
};

export default function StoreCard({ store, linkPrefix = "/user/store" }) {
  const emoji    = categoryEmojis[store.category]    || "🏪";
  const gradient = categoryGradients[store.category] || "from-gray-500 to-gray-600";
  const accentColor = categoryColors[store.category] || "#ff6b35";

  return (
    <Link to={`${linkPrefix}/${store._id}`} style={{ display: "block" }}>
      <div
        className="relative overflow-hidden cursor-pointer group h-full"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-8px)";
          e.currentTarget.style.borderColor = accentColor + "60";
          e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}20`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Banner */}
        <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {/* Animated background orbs */}
          <div
            className="absolute top-0 left-0 w-24 h-24 rounded-full opacity-30"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)",
              transform: "translate(-30%, -30%)",
              animation: "floatSlow 6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-20 h-20 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)",
              transform: "translate(30%, 30%)",
              animation: "floatSlow 8s ease-in-out infinite reverse",
            }}
          />

          {/* Emoji */}
          <div
            className="text-6xl z-10 transition-all duration-500"
            style={{
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            {emoji}
          </div>

          {/* Status badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md"
            style={{
              background: store.isOpen ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)",
              border: `1px solid ${store.isOpen ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              color: store.isOpen ? "#4ade80" : "#f87171",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: store.isOpen ? "#4ade80" : "#f87171",
                animation: store.isOpen ? "pulseDot 1.5s infinite" : "none",
              }}
            />
            {store.isOpen ? "Open" : "Closed"}
          </div>

          {/* Express badge */}
          {store.deliveryTime && store.deliveryTime.includes("10") && (
            <div
              className="absolute top-3 right-10 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md"
              style={{
                background: "rgba(245,158,11,0.25)",
                border: "1px solid rgba(245,158,11,0.4)",
                color: "#fbbf24",
              }}
            >
              <Zap size={10} />⚡ Express
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }}
          />

          {/* Favorite button */}
          <div className="absolute bottom-3 right-3 z-10" onClick={(e) => e.preventDefault()}>
            <FavoriteButton storeId={store._id} size={15} />
          </div>

          {/* Category label at bottom */}
          <div
            className="absolute bottom-3 left-3 text-xs font-bold text-white/70 backdrop-blur-sm px-2 py-0.5 rounded-lg"
            style={{ background: "rgba(0,0,0,0.3)" }}
          >
            {store.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Store name row */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3
                className="font-bold text-base truncate transition-colors duration-200 group-hover:text-orange-400"
                style={{ color: "var(--text-primary)" }}
              >
                {store.name}
              </h3>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                📍 {store.address}
              </p>
            </div>
            <div
              className="flex-shrink-0 p-2 rounded-xl transition-all duration-300 group-hover:translate-x-1"
              style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
            >
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Rating */}
            <div
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
            >
              <Star size={11} fill="#f59e0b" stroke="none" />
              {store.rating?.toFixed(1) || "4.5"}
              <span className="font-normal opacity-60">({store.totalRatings || 0})</span>
            </div>

            {/* Delivery time */}
            <div
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
              style={{ background: "var(--elevated)", color: "var(--text-secondary)" }}
            >
              <Clock size={11} />
              {store.deliveryTime || "20-30 min"}
            </div>

            {/* Min order */}
            {store.minOrder > 0 && (
              <div
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
              >
                Min ₹{store.minOrder}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between mt-3 pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <TrendingUp size={10} style={{ color: accentColor }} />
              <span style={{ color: accentColor, fontWeight: 700 }}>Free delivery</span>
            </div>
            <div
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
              style={{ background: accentColor + "15", color: accentColor }}
            >
              Order now →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}