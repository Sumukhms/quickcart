/**
 * StoreCard — Enhanced with animations, micro-interactions, and visual polish
 */
import { Link } from "react-router-dom";
import { Clock, ChevronRight, Zap, Star, TrendingUp } from "lucide-react";
import FavoriteButton from "./ui/FavoriteButton";
import LazyImage from "./ui/LazyImage"; // <-- IMPORT ADDED HERE

const categoryEmojis = {
  Groceries: "🛒",
  Food: "🍛",
  Snacks: "🍕",
  Beverages: "🧃",
  Medicines: "💊",
  Other: "🏪",
};

const categoryColors = {
  Groceries: "#22c55e",
  Food: "#f97316",
  Snacks: "#eab308",
  Beverages: "#3b82f6",
  Medicines: "#ef4444",
  Other: "#8b5cf6",
};

export default function StoreCard({ store, linkPrefix = "/user/store" }) {
  const emoji = categoryEmojis[store.category] || "🏪";
  const bannerColor = categoryColors[store.category] || "#f3f4f6";
  const accentColor = categoryColors[store.category] || "#ff6b35";

  return (
    <Link to={`${linkPrefix}/${store._id}`} style={{ display: "block", height: "100%" }}>
      <div
        className="relative overflow-hidden cursor-pointer h-full rounded-2xl group"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          transition: "border-color 0.25s ease, transform 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = accentColor + "80";
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Banner Area */}
        <div
          className="relative h-40 flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: bannerColor,
            minHeight: "10rem",
          }}
        >
          {/* THE FIX: Check for store.image. If it exists, show it. Otherwise, show emoji. */}
          {store.image ? (
            <>
              <LazyImage
                src={store.image}
                alt={store.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                style={{ zIndex: 0 }}
                fallback={emoji}
              />
              {/* Gradient overlay to make sure badges are readable over bright images */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent pointer-events-none z-10" />
            </>
          ) : (
            <div className="text-6xl z-10 transition-transform duration-300 group-hover:scale-110" style={{ color: "white" }}>
              {emoji}
            </div>
          )}

          {/* Status badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md z-10"
            style={{
              background: store.isOpen
                ? "rgba(34,197,94,0.25)"
                : "rgba(239,68,68,0.25)",
              border: `1px solid ${store.isOpen ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              color: store.isOpen ? "#4ade80" : "#f87171",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: store.isOpen ? "#4ade80" : "#f87171" }}
            />
            {store.isOpen ? "Open" : "Closed"}
          </div>

          {/* Express badge */}
          {store.deliveryTime && store.deliveryTime.includes("10") && (
            <div
              className="absolute top-3 right-10 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-md z-10"
              style={{
                background: "rgba(245,158,11,0.25)",
                border: "1px solid rgba(245,158,11,0.4)",
                color: "#fbbf24",
              }}
            >
              <Zap size={10} />⚡ Express
            </div>
          )}

          {/* Favorite button */}
          <div
            className="absolute bottom-3 right-3 z-20 bg-black/20 rounded-full p-1 backdrop-blur-sm"
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton storeId={store._id} size={16} />
          </div>

          {/* Category label at bottom */}
          <div
            className="absolute bottom-3 left-3 text-[10px] font-bold text-white px-2 py-0.5 rounded-lg z-10 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {store.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col justify-between" style={{ height: "calc(100% - 10rem)" }}>
          <div>
            {/* Store name row */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <h3
                  className="font-bold text-base truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {store.name}
                </h3>
                <p
                  className="text-[11px] mt-0.5 truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  📍 {store.address}
                </p>
              </div>
              <div
                className="flex-shrink-0 p-1.5 rounded-lg transition-transform group-hover:translate-x-1"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-muted)",
                }}
              >
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Metrics row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Rating */}
              {store.totalRatings > 0 ? (
                <div
                  className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    color: "#f59e0b",
                  }}
                >
                  <Star size={10} fill="#f59e0b" stroke="none" />
                  {store.rating?.toFixed(1) || "4.5"}
                  <span className="font-normal opacity-60">
                    ({store.totalRatings})
                  </span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg"
                  style={{
                    background: "rgba(59,130,246,0.12)",
                    color: "#3b82f6",
                  }}
                >
                  <span className="text-sm">✨</span>
                  New
                </div>
              )}

              {/* Delivery time */}
              <div
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-secondary)",
                }}
              >
                <Clock size={10} />
                {store.deliveryTime || "20-30 min"}
              </div>

              {/* Min order */}
              {store.minOrder > 0 && (
                <div
                  className="text-[11px] font-semibold px-2 py-1 rounded-lg"
                  style={{
                    background: "var(--elevated)",
                    color: "var(--text-muted)",
                  }}
                >
                  Min ₹{store.minOrder}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between mt-4 pt-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <TrendingUp size={10} style={{ color: accentColor }} />
              <span style={{ color: accentColor, fontWeight: 700 }}>
                Free delivery
              </span>
            </div>
            <div
              className="text-[11px] font-bold px-2.5 py-1 rounded-md transition-colors group-hover:bg-opacity-20"
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