import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function ProductCard({ product, store }) {
  const { cartItems, addToCart, updateQty, removeFromCart } = useCart();
  const [adding, setAdding] = useState(false);
  
  const inCart = cartItems.find(i => i._id === product._id);
  const discount = product.originalPrice ? 
    Math.round((1 - product.price / product.originalPrice) * 100) : null;

  const handleAdd = async () => {
    setAdding(true);
    addToCart(product, store);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 group hover:-translate-y-1"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,107,53,0.2)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
      
      {/* Image */}
      <div className="relative h-36 overflow-hidden" style={{ background: "var(--elevated)" }}>
        {product.image ? (
          <img src={product.image} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🛍️
          </div>
        )}
        
        {discount && (
          <div className="absolute top-2 left-2 tag tag-green text-[10px] font-bold">
            {discount}% OFF
          </div>
        )}
        
        {!product.available && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="tag tag-red text-xs">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--text-primary)" }}>
          {product.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {product.unit || "1 piece"}
        </p>
        
        {product.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs ml-1.5 line-through" style={{ color: "var(--text-muted)" }}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>

          {product.available && (
            inCart ? (
              <div className="flex items-center gap-1.5 rounded-xl px-1.5 py-1"
                style={{ background: "rgba(255,107,53,0.1)", border: "1.5px solid var(--brand)" }}>
                <button onClick={() => inCart.qty === 1 ? removeFromCart(product._id) : updateQty(product._id, inCart.qty - 1)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 text-orange-400">
                  <Minus size={12} />
                </button>
                <span className="w-5 text-center text-sm font-bold" style={{ color: "var(--brand)" }}>
                  {inCart.qty}
                </span>
                <button onClick={() => updateQty(product._id, inCart.qty + 1)}
                  className="w-6 h-6 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                  style={{ background: "var(--brand)" }}>
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button onClick={handleAdd} disabled={adding}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-60"
                style={{ background: adding ? "var(--brand-light)" : "var(--brand)", boxShadow: "0 4px 12px rgba(255,107,53,0.3)" }}>
                {adding ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}