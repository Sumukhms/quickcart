/**
 * ProductCard — Enhanced with rich animations and micro-interactions
 */
import { useState } from "react";
import { Plus, Minus, ShoppingCart, Leaf, Flame } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { OutOfStockOverlay } from "../ui/StockBadge";

const SPICE_CONFIG = {
  mild:   { label: "Mild",   color: "#22c55e", emoji: "🟢" },
  medium: { label: "Medium", color: "#f59e0b", emoji: "🟡" },
  hot:    { label: "Hot",    color: "#ef4444", emoji: "🔴" },
};

export default function ProductCard({ product, store, isFood = false }) {
  const { cartItems, addToCart, updateQty, removeFromCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const isOutOfStock = !product.available || product.stock === 0;
  const isLowStock   = product.available && product.stock > 0 && product.stock <= 10;

  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const inCart = cartItems.find((i) => i._id === product._id);
  const spice  = product.spiceLevel ? SPICE_CONFIG[product.spiceLevel] : null;

  const handleAdd = async () => {
    if (isOutOfStock) return;
    setAdding(true);
    addToCart(product, store);
    setTimeout(() => {
      setAdding(false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    }, 400);
  };

  return (
    <div
      className="relative overflow-hidden group"
      style={{
        background: "var(--card)",
        border: `1px solid ${isOutOfStock ? "var(--border)" : inCart ? "rgba(255,107,53,0.3)" : "var(--border)"}`,
        borderRadius: "18px",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: isOutOfStock ? 0.65 : 1,
        boxShadow: inCart ? "0 0 0 1px rgba(255,107,53,0.15), 0 8px 20px rgba(255,107,53,0.1)" : "none",
      }}
      onMouseEnter={(e) => {
        if (!isOutOfStock) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = inCart
            ? "0 0 0 1px rgba(255,107,53,0.25), 0 16px 40px rgba(0,0,0,0.25)"
            : "0 12px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,107,53,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = inCart ? "0 0 0 1px rgba(255,107,53,0.15), 0 8px 20px rgba(255,107,53,0.1)" : "none";
      }}
    >
      {/* Image area */}
      <div className="relative h-36 overflow-hidden" style={{ background: "var(--elevated)" }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-4xl"
            style={{ animation: "float 4s ease-in-out infinite" }}
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
            style={{ background: "rgba(245,158,11,0.9)", color: "white", backdropFilter: "blur(4px)" }}
          >
            ⚡ {product.stock} left
          </div>
        )}

        {/* In-cart indicator */}
        {inCart && (
          <div
            className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ background: "rgba(255,107,53,0.9)", color: "white", backdropFilter: "blur(4px)" }}
          >
            <ShoppingCart size={9} /> {inCart.qty}
          </div>
        )}

        {/* Out of stock overlay */}
        <OutOfStockOverlay available={product.available} stock={product.stock} />
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Name */}
        <p
          className="font-bold text-sm leading-tight line-clamp-2 mb-1"
          style={{ color: "var(--text-primary)", minHeight: "2.5rem" }}
        >
          {product.name}
        </p>

        {/* Food meta chips */}
        {isFood && (spice || product.unit || product.prepTime) && (
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {spice && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: spice.color + "18", color: spice.color }}
              >
                {spice.emoji} {spice.label}
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
          <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>{product.unit}</p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-black text-base" style={{ color: "var(--text-primary)" }}>
              ₹{product.price}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs line-through" style={{ color: "var(--text-muted)" }}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {/* Out of stock text */}
          {isOutOfStock ? (
            <span
              className="text-xs font-bold px-2 py-1 rounded-xl"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
            >
              Unavailable
            </span>
          ) : inCart ? (
            /* Qty stepper */
            <div
              className="flex items-center gap-1 rounded-xl px-1 py-1"
              style={{
                background: "rgba(255,107,53,0.1)",
                border: "1.5px solid var(--brand)",
              }}
            >
              <button
                onClick={() => inCart.qty === 1 ? removeFromCart(product._id) : updateQty(product._id, inCart.qty - 1)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-orange-400 transition-all hover:scale-110 hover:bg-orange-400 hover:text-white active:scale-95"
                style={{ background: "var(--card)" }}
              >
                <Minus size={11} />
              </button>
              <span
                className="w-5 text-center text-sm font-black"
                style={{ color: "var(--brand)" }}
              >
                {inCart.qty}
              </span>
              <button
                onClick={() => updateQty(product._id, inCart.qty + 1)}
                className="w-6 h-6 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 hover:opacity-90 active:scale-95"
                style={{ background: "var(--brand)" }}
              >
                <Plus size={11} />
              </button>
            </div>
          ) : (
            /* Add button */
            <button
              onClick={handleAdd}
              disabled={adding}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white relative overflow-hidden"
              style={{
                background: justAdded
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "linear-gradient(135deg, var(--brand), var(--brand-dark))",
                boxShadow: `0 4px 15px ${justAdded ? "rgba(34,197,94,0.4)" : "rgba(255,107,53,0.4)"}`,
                transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                transform: adding ? "scale(0.9)" : "scale(1)",
              }}
            >
              {adding ? (
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                  style={{ animation: "spin 0.7s linear infinite" }}
                />
              ) : justAdded ? (
                <span style={{ fontSize: "14px", animation: "scaleIn 0.3s ease" }}>✓</span>
              ) : (
                <Plus size={16} />
              )}
              {/* Ripple effect on click */}
              {adding && (
                <div
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.3)",
                    animation: "ripple 0.6s ease-out",
                  }}
                />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}