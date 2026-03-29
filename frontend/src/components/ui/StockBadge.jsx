/**
 * StockBadge — shows stock status on product cards.
 *
 * Props:
 *   available  {bool}    product.available flag
 *   stock      {number}  product.stock count
 *   showCount  {bool}    show "Only N left" when stock is low
 *   className  {string}
 *
 * Used in ProductCard (already has an overlay — this extracts it
 * so it can also be used in store product management lists).
 */
export default function StockBadge({ available, stock, showCount = false, className = "" }) {
  if (available && stock > 10) return null; // plenty in stock — don't clutter UI

  if (!available || stock === 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 tag tag-red text-[10px] font-bold ${className}`}
      >
        ✕ Out of Stock
      </span>
    );
  }

  // Low stock warning (1–10 remaining)
  if (showCount && stock <= 10 && stock > 0) {
    return (
      <span
        className={`inline-flex items-center gap-1 tag tag-yellow text-[10px] font-bold ${className}`}
      >
        ⚡ Only {stock} left
      </span>
    );
  }

  return null;
}

/**
 * Overlay version — full-coverage overlay for product card images.
 * Drop directly inside the image container.
 */
export function OutOfStockOverlay({ available, stock }) {
  if (available && stock > 0) return null;
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1.5"
      style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(2px)" }}
    >
      <span
        className="text-xs font-bold px-3 py-1.5 rounded-full"
        style={{ background: "rgba(239,68,68,0.9)", color: "white" }}
      >
        Out of Stock
      </span>
    </div>
  );
}