/**
 * ProductCard — UPDATED
 *
 * Changes from original:
 *   1. Uses OutOfStockOverlay from StockBadge (extracted component)
 *   2. Checks BOTH product.available AND product.stock === 0
 *   3. "Add to Cart" button is disabled + replaced with badge when out of stock
 *   4. Low-stock warning badge (≤10) when showLowStock is true
 *
 * Props: (unchanged from original)
 *   product   {object}
 *   store     {object}
 *   isFood    {bool}
 */
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { OutOfStockOverlay } from "../ui/StockBadge";

const SPICE_ICONS = {
  mild:   { label: "Mild",   color: "#22c55e" },
  medium: { label: "Medium", color: "#f59e0b" },
  hot:    { label: "Hot",    color: "#ef4444" },
};

export default function ProductCard({ product, store, isFood = false }) {
  const { cartItems, addToCart, updateQty, removeFromCart } = useCart();
  const [adding, setAdding] = useState(false);

  // ── Stock logic ──────────────────────────────────────────────
  // A product is unavailable if:  available flag is false  OR  stock count is 0
  const isOutOfStock = !product.available || product.stock === 0;
  const isLowStock   = product.available && product.stock > 0 && product.stock <= 10;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const inCart = cartItems.find((i) => i._id === product._id);

  const handleAdd = async () => {
    if (isOutOfStock) return; // guard — button should already be disabled
    setAdding(true);
    addToCart(product, store);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 group hover:-translate-y-1"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        opacity: isOutOfStock ? 0.7 : 1,
      }}
      onMouseEnter={(e) =>
        !isOutOfStock && (e.currentTarget.style.borderColor = "rgba(255,107,53,0.2)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--border)")
      }
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden" style={{ background: "var(--elevated)" }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {isFood ? "🍽️" : "🛍️"}
          </div>
        )}

        {/* Badges (top-left) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFood && (
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{
                background: "white",
                border: `1.5px solid ${product.isVeg ? "#22c55e" : "#ef4444"}`,
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: product.isVeg ? "#22c55e" : "#ef4444" }}
              />
            </div>
          )}
          {discount && discount > 0 && !isOutOfStock && (
            <div className="tag tag-green text-[10px] font-bold px-1.5 py-0.5">
              {discount}% OFF
            </div>
          )}
        </div>

        {/* Low stock badge (top-right) */}
        {isLowStock && (
          <div className="absolute top-2 right-2">
            <span className="tag tag-yellow text-[10px] font-bold px-1.5 py-0.5">
              ⚡ {product.stock} left
            </span>
          </div>
        )}

        {/* Out of stock overlay */}
        <OutOfStockOverlay available={product.available} stock={product.stock} />
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="font-semibold text-sm leading-tight line-clamp-2"
          style={{ color: "var(--text-primary)", minHeight: "2.5rem" }}
        >
          {product.name}
        </p>

        {/* Food meta */}
        {isFood && (product.unit || product.spiceLevel || product.prepTime) && (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {product.unit && (
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {product.unit}
              </span>
            )}
            {product.spiceLevel && SPICE_ICONS[product.spiceLevel] && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{
                  background: SPICE_ICONS[product.spiceLevel].color + "15",
                  color: SPICE_ICONS[product.spiceLevel].color,
                }}
              >
                {product.spiceLevel === "mild"
                  ? "🟢"
                  : product.spiceLevel === "medium"
                  ? "🟡"
                  : "🔴"}{" "}
                {SPICE_ICONS[product.spiceLevel].label}
              </span>
            )}
            {product.prepTime && (
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                ⏱ {product.prepTime}
              </span>
            )}
          </div>
        )}

        {/* Non-food unit */}
        {!isFood && product.unit && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {product.unit}
          </p>
        )}

        {/* Description preview (non-food) */}
        {product.description && !isFood && (
          <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>
            {product.description}
          </p>
        )}

        {/* Price + Add / qty control */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs ml-1.5 line-through" style={{ color: "var(--text-muted)" }}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Out-of-stock text replacement */}
          {isOutOfStock ? (
            <span
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
            >
              Unavailable
            </span>
          ) : inCart ? (
            /* Quantity stepper */
            <div
              className="flex items-center gap-1.5 rounded-xl px-1.5 py-1"
              style={{
                background: "rgba(255,107,53,0.1)",
                border: "1.5px solid var(--brand)",
              }}
            >
              <button
                onClick={() =>
                  inCart.qty === 1
                    ? removeFromCart(product._id)
                    : updateQty(product._id, inCart.qty - 1)
                }
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-orange-400"
              >
                <Minus size={12} />
              </button>
              <span
                className="w-5 text-center text-sm font-bold"
                style={{ color: "var(--brand)" }}
              >
                {inCart.qty}
              </span>
              <button
                onClick={() => updateQty(product._id, inCart.qty + 1)}
                className="w-6 h-6 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                style={{ background: "var(--brand)" }}
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            /* Add button */
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-60"
              style={{
                background: adding ? "var(--brand-light)" : "var(--brand)",
                boxShadow: "0 4px 12px rgba(255,107,53,0.3)",
              }}
            >
              {adding ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={16} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}