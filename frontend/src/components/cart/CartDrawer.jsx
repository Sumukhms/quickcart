import { useEffect, useState } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Package, Sparkles } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

function CartItem({ item, onUpdate, onRemove, index }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(item._id), 300);
  };

  return (
    <div
      className="flex gap-3 p-3 rounded-2xl group relative overflow-hidden"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        animation: `slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 50}ms both`,
        transition: removing ? "all 0.3s ease" : "transform 0.2s ease, box-shadow 0.2s ease",
        transform: removing ? "translateX(100%) scale(0.9)" : "translateX(0) scale(1)",
        opacity: removing ? 0 : 1,
      }}
      onMouseEnter={(e) => {
        if (!removing) {
          e.currentTarget.style.borderColor = "rgba(255,107,53,0.25)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Product image */}
      <div
        className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-2xl"
        style={{ background: "var(--elevated)" }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : "🛍️"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
          {item.name}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {item.unit || "1 piece"} · ₹{item.price} each
        </p>
        <p className="font-black text-sm mt-1" style={{ color: "var(--brand)" }}>
          ₹{(item.price * item.qty).toFixed(0)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end justify-between gap-1">
        {/* Remove button */}
        <button
          onClick={handleRemove}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
        >
          <Trash2 size={12} />
        </button>

        {/* Qty stepper */}
        <div
          className="flex items-center gap-1.5 rounded-xl px-1.5 py-1"
          style={{ background: "var(--elevated)" }}
        >
          <button
            onClick={() => item.qty === 1 ? handleRemove() : onUpdate(item._id, item.qty - 1)}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ background: "var(--card)", color: "var(--brand)" }}
          >
            <Minus size={11} />
          </button>
          <span
            className="w-6 text-center text-sm font-black"
            style={{ color: "var(--text-primary)" }}
          >
            {item.qty}
          </span>
          <button
            onClick={() => onUpdate(item._id, item.qty + 1)}
            className="w-6 h-6 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
            style={{ background: "var(--brand)" }}
          >
            <Plus size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({ open, onClose }) {
  const { cartItems, cartStore, total, count, updateQty, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const subtotal  = total;
  const delivery  = 20;
  const grandTotal = subtotal + delivery;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col w-full max-w-[420px] shadow-2xl"
        style={{
          backgroundColor: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,107,53,0.08))",
                border: "1px solid rgba(255,107,53,0.25)",
              }}
            >
              <ShoppingBag size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                Your Cart
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {count} item{count !== 1 ? "s" : ""}
                {cartStore && <> · <span style={{ color: "var(--brand)" }}>{cartStore.name}</span></>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all hover:scale-105"
                style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)" }}
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-all hover:scale-110"
              style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 pb-10">
              <div
                className="text-7xl select-none"
                style={{ animation: "floatSlow 4s ease-in-out infinite" }}
              >
                🛒
              </div>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: "var(--text-secondary)" }}>
                  Your cart is empty
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Discover stores and add items you love
                </p>
              </div>
              <button onClick={onClose} className="btn btn-brand text-sm">
                Browse Stores <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            cartItems.map((item, i) => (
              <CartItem
                key={item._id}
                item={item}
                index={i}
                onUpdate={updateQty}
                onRemove={removeFromCart}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div
            className="p-4 space-y-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {/* Savings hint */}
            <div
              className="flex items-center justify-between text-xs px-3 py-2.5 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={11} />
                Add coupon at checkout to save more
              </span>
              <Tag size={11} />
            </div>

            {/* Bill breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Subtotal ({count} items)</span>
                <span className="font-semibold">₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Delivery fee</span>
                <span className="font-semibold">₹{delivery}</span>
              </div>
              <div
                className="flex justify-between font-black text-lg pt-2"
                style={{ borderTop: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <span>Total</span>
                <span style={{ color: "var(--brand)" }}>₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => { onClose(); navigate("/checkout"); }}
              className="btn btn-brand w-full justify-center text-base py-4 relative overflow-hidden"
              style={{ boxShadow: "0 8px 25px rgba(255,107,53,0.4)" }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  animation: "gradientShift 2s linear infinite",
                }}
              />
              Checkout · ₹{grandTotal.toFixed(0)}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}