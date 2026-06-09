/**
 * StoreCard — Production commerce card, Blinkit/Zepto style
 */
import { Link } from "react-router-dom";
import { Clock, ChevronRight, Zap, Star } from "lucide-react";
import FavoriteButton from "./ui/FavoriteButton";
import LazyImage from "./ui/LazyImage";

const categoryColors = {
  Groceries: { bg: "#16a34a", light: "rgba(22,163,74,0.12)", text: "#16a34a" },
  Food:      { bg: "#ea580c", light: "rgba(234,88,12,0.12)",  text: "#ea580c" },
  Snacks:    { bg: "#ca8a04", light: "rgba(202,138,4,0.12)",  text: "#ca8a04" },
  Beverages: { bg: "#2563eb", light: "rgba(37,99,235,0.12)",  text: "#2563eb" },
  Medicines: { bg: "#dc2626", light: "rgba(220,38,38,0.12)",  text: "#dc2626" },
  Other:     { bg: "#7c3aed", light: "rgba(124,58,237,0.12)", text: "#7c3aed" },
};

const categoryEmojis = {
  Groceries: "🛒",
  Food:      "🍛",
  Snacks:    "🍕",
  Beverages: "🧃",
  Medicines: "💊",
  Other:     "🏪",
};

export default function StoreCard({ store, linkPrefix = "/user/store" }) {
  const emoji  = categoryEmojis[store.category] || "🏪";
  const colors = categoryColors[store.category] || categoryColors.Other;

  return (
    <Link to={`${linkPrefix}/${store._id}`} className="block h-full group">
      <div
        className="relative overflow-hidden h-full rounded-xl card card-hover"
        style={{ cursor: "pointer" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-strong)";
          e.currentTarget.style.transform = "translateY(-3px)";
          e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
        }}
      >
        {/* ── Banner ── */}
        <div className="relative h-40 overflow-hidden bg-transparent">
          <LazyImage
            src={store.image}
            alt={store.name}
            className="absolute inset-0 w-full h-full p-2 transition-transform duration-500 group-hover:scale-[1.04]"
            imageClassName="object-contain drop-shadow-sm"
            style={{ zIndex: 0 }}
            fallback={
              <div
                className="absolute inset-0 flex items-center justify-center w-full h-full"
                style={{
                  background: `linear-gradient(145deg, ${colors.light}, var(--elevated))`,
                }}
              >
                <span className="text-5xl transition-transform duration-300 group-hover:scale-110 select-none drop-shadow-sm">
                  {emoji}
                </span>
              </div>
            }
          />

          {/* Open/Closed badge */}
          <div
            className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold z-10"
            style={{
              background: store.isOpen
                ? "rgba(22,163,74,0.88)"
                : "rgba(220,38,38,0.80)",
              color: "#fff",
              backdropFilter: "blur(6px)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full bg-white"
              style={{ opacity: store.isOpen ? 1 : 0.7 }}
            />
            {store.isOpen ? "Open" : "Closed"}
          </div>

          {/* Express badge */}
          {store.deliveryTime?.includes("10") && (
            <div
              className="absolute top-2.5 left-[70px] flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold z-10"
              style={{
                background: "rgba(217,119,6,0.88)",
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              <Zap size={10} />
              Express
            </div>
          )}

          {/* Favorite */}
          <div
            className="absolute top-2 right-2 z-20"
            onClick={(e) => e.preventDefault()}
          >
            <FavoriteButton storeId={store._id} size={15} />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="p-3.5">
          {/* Store name + chevron */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3
                className="font-display font-bold text-[15px] leading-tight truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {store.name}
              </h3>
              <p
                className="text-[12px] mt-0.5 truncate flex items-center gap-1"
                style={{ color: "var(--text-muted)" }}
              >
                {store.address}
              </p>
            </div>
            <div
              className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Rating */}
            {store.totalRatings > 0 ? (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-bold"
                style={{
                  background: "rgba(202,138,4,0.10)",
                  color: "#b45309",
                }}
              >
                <Star size={10} fill="#b45309" stroke="none" />
                {store.rating?.toFixed(1) || "4.5"}
                <span className="font-normal opacity-70">
                  ({store.totalRatings})
                </span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-bold"
                style={{
                  background: "var(--blue-bg)",
                  color: "var(--blue)",
                }}
              >
                New
              </div>
            )}

            {/* Delivery time */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-semibold"
              style={{
                background: "var(--elevated)",
                color: "var(--text-secondary)",
              }}
            >
              <Clock size={10} />
              {store.deliveryTime || "20–30 min"}
            </div>

            {/* Min order */}
            {store.minOrder > 0 && (
              <div
                className="px-2 py-1 rounded-md text-[12px] font-semibold"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-muted)",
                }}
              >
                Min ₹{store.minOrder}
              </div>
            )}
          </div>

          {/* Footer strip */}
          <div
            className="flex items-center justify-between mt-3 pt-2.5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span
              className="text-[12px] font-semibold"
              style={{ color: "var(--green)" }}
            >
              Free delivery
            </span>
            <span
              className="text-[12px] font-bold px-2.5 py-1 rounded-md transition-colors"
              style={{
                background: "var(--brand-dim)",
                color: "var(--brand)",
              }}
            >
              Order →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}