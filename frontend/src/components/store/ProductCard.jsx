/**
 * ProductCard — Enhanced with rich animations and micro-interactions
 */
import { useState } from "react";
import { Plus, Minus, ShoppingCart, Leaf, Flame } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { OutOfStockOverlay } from "../ui/StockBadge";
import LazyImage from "../ui/LazyImage";

const SPICE_CONFIG = {
  mild: { label: "Mild", color: "#22c55e", emoji: "🟢" },
  medium: { label: "Medium", color: "#f59e0b", emoji: "🟡" },
  hot: { label: "Hot", color: "#ef4444", emoji: "🔴" },
};

export default function ProductCard({ product, store, isFood = false }) {
  const { cartItems, addToCart, updateQty, removeFromCart } = useCart();
  const [adding, setAdding] = useState(false);

  const isOutOfStock = !product.available || product.stock === 0;
  const isLowStock =
    product.available && product.stock > 0 && product.stock <= 10;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : null;

  const inCart = cartItems.find((i) => i._id === product._id);
  const spice = product.spiceLevel ? SPICE_CONFIG[product.spiceLevel] : null;

  const handleAdd = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    addToCart(product, store);
    setTimeout(() => {
      setAdding(false);
    }, 200);
  };

  return (
    <div
      className="relative overflow-hidden group"
      style={{
        background: "var(--card)",
        border: `1px solid ${isOutOfStock ? "var(--border)" : inCart ? "rgba(255,107,53,0.3)" : "var(--border)"}`,
        borderRadius: "18px",
        transition: "border-color 0.25s ease, opacity 0.25s ease",
        opacity: isOutOfStock ? 0.65 : 1,
      }}
    >
      {/* Image area */}
      <div
        className="relative h-36 overflow-hidden"
        style={{ background: "var(--elevated)" }}
      >
        {product.image ? (
          <LazyImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            fallback={isFood ? "🍽️" : "🛍️"}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ color: "var(--text-muted)" }}
          >
            {isFood ? "🍽️" : "🛍️"}
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isFood && (
            <div
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{
                background: "white",
                border: `2px solid ${product.isVeg ? "#22c55e" : "#ef4444"}`,
              }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: product.isVeg ? "#22c55e" : "#ef4444" }}
              />
            </div>
          )}
          {discount && discount > 0 && !isOutOfStock && (
            <div
              className="text-[10px] font-black px-1.5 py-0.5 rounded-lg"
              style={{ background: "#22c55e", color: "white" }}
            >
              -{discount}%
            </div>
          )}
        </div>

        {/* Low stock badge */}
        {isLowStock && (
          <div
            className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
            style={{
              background: "rgba(245,158,11,0.9)",
              color: "white",
              backdropFilter: "blur(4px)",
            }}
          >
            ⚡ {product.stock} left
          </div>
        )}

        {/* In-cart indicator */}
        {inCart && (
          <div
            className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{
              background: "rgba(255,107,53,0.9)",
              color: "white",
              backdropFilter: "blur(4px)",
            }}
          >
            <ShoppingCart size={9} /> {inCart.qty}
          </div>
        )}

        {/* Out of stock overlay */}
        <OutOfStockOverlay
          available={product.available}
          stock={product.stock}
        />
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        {/* Name */}
        <p
          className="font-bold text-sm leading-tight line-clamp-2"
          style={{ color: "var(--text-primary)" }}
        >
          {product.name}
        </p>
        
        {/* Details / Description */}
        {product.description && (
          <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1">
            {product.description}
          </p>
        )}

        {/* Food meta chips */}
        {isFood && (spice || product.unit || product.prepTime) && (
          <div className="flex items-center gap-1.5 mt-2 mb-1 flex-wrap">
            {spice && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: spice.color + "18", color: spice.color }}
              >
                {spice.emoji} {spice.label}
              </span>
            )}
            {product.prepTime && (
              <span
                className="text-[10px]"
                style={{ color: "var(--text-muted)" }}
              >
                ⏱ {product.prepTime}
              </span>
            )}
          </div>
        )}

        {/* Non-food unit */}
        {!isFood && product.unit && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {product.unit}
          </p>
        )}

        {/* Spacer to push price to bottom */}
        <div className="mt-auto pt-2"></div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className="font-black text-[15px]"
              style={{ color: "var(--text-primary)" }}
            >
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span
                className="text-[10px] line-through"
                style={{ color: "var(--text-muted)" }}
              >
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Out of stock text */}
          {isOutOfStock ? (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            >
              Sold Out
            </span>
          ) : inCart ? (
            <div className="flex items-center rounded-lg bg-[rgba(255,107,53,0.08)] border border-[var(--brand)] shrink-0 overflow-hidden">
              <button
                onClick={() =>
                  inCart.qty === 1
                    ? removeFromCart(product._id)
                    : updateQty(product._id, inCart.qty - 1)
                }
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-[var(--brand)] transition-colors hover:bg-[rgba(255,107,53,0.15)] active:bg-[rgba(255,107,53,0.2)]"
              >
                <Minus size={13} strokeWidth={2.5} />
              </button>
              <span className="w-5 text-center text-[12px] font-black text-[var(--brand)]">
                {inCart.qty}
              </span>
              <button
                onClick={() => updateQty(product._id, inCart.qty + 1)}
                className="w-7 h-7 flex-shrink-0 flex items-center justify-center text-white transition-opacity hover:opacity-90 active:opacity-80"
                style={{ background: "var(--brand)" }}
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shrink-0"
              style={{
                background: "var(--brand)",
              }}
            >
              {adding ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                <Plus size={16} strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
