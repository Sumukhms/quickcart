import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, Tag, ChevronLeft, ShoppingBag, Sparkles, Percent } from "lucide-react";
import { useCart } from "../../context/CartContext";

// ── Swipe-to-delete item row ──────────────────────────────────
function CartItem({ item, updateQty, removeFromCart, index }) {
  const [swiped, setSwiped] = useState(false);

  return (
    <div
      className="relative overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Delete backdrop revealed on swipe */}
      <div
        className="absolute inset-0 flex items-center justify-end px-6 transition-opacity duration-200"
        style={{
          background: "linear-gradient(90deg, transparent 60%, rgba(239,68,68,0.15) 100%)",
          opacity: swiped ? 1 : 0,
          pointerEvents: swiped ? "auto" : "none",
        }}
      >
        <button
          onClick={() => removeFromCart(item._id)}
          className="p-3 rounded-xl bg-red-500 text-white shadow-lg active:scale-90 transition-transform"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Main item row */}
      <div
        className={`flex gap-4 p-4 relative bg-[var(--surface)] transition-transform duration-200 ${
          swiped ? "-translate-x-20" : "translate-x-0"
        }`}
        onTouchStart={(e) => {
          e.currentTarget._startX = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const diff = (e.currentTarget._startX || 0) - (e.changedTouches[0]?.clientX || 0);
          setSwiped(diff > 60);
        }}
        onClick={() => swiped && setSwiped(false)}
      >
        {/* Product image */}
        <div className="w-[72px] h-[72px] rounded-2xl flex-shrink-0 overflow-hidden bg-[var(--elevated)] flex items-center justify-center border border-[var(--border)] relative">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<span class="text-2xl">🛍️</span>'; }}
            />
          ) : (
            <span className="text-2xl">🛍️</span>
          )}
          {/* Qty badge on image */}
          <span
            className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white px-1 shadow-sm"
            style={{ background: "var(--brand)" }}
          >
            ×{item.qty}
          </span>
        </div>

        {/* Product details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="font-bold text-[15px] leading-snug text-[var(--text-primary)] truncate">
            {item.name}
          </p>
          <p className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
            {item.unit || "1 piece"} • ₹{item.price} each
          </p>
          <p className="font-black text-[16px] mt-1.5 text-[var(--text-primary)]">
            ₹{(item.price * item.qty).toFixed(0)}
          </p>
        </div>

        {/* Qty stepper */}
        <div className="flex flex-col items-end justify-center">
          <div
            className="flex items-center gap-0 rounded-2xl overflow-hidden border border-[var(--border)] shadow-sm"
            style={{ background: "var(--elevated)" }}
          >
            <button
              onClick={() =>
                item.qty === 1
                  ? removeFromCart(item._id)
                  : updateQty(item._id, item.qty - 1)
              }
              className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 hover:bg-[var(--hover)]"
              style={{ color: item.qty === 1 ? "#ef4444" : "var(--text-primary)" }}
            >
              {item.qty === 1 ? <Trash2 size={13} /> : <Minus size={14} strokeWidth={2.5} />}
            </button>
            <span
              className="w-8 text-center text-sm font-black text-[var(--text-primary)] select-none"
              style={{ borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}
            >
              {item.qty}
            </span>
            <button
              onClick={() => updateQty(item._id, item.qty + 1)}
              className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 text-white font-bold"
              style={{ background: "var(--brand)" }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Cart Page ────────────────────────────────────────────
export default function UserCart() {
  const { cartItems, cartStore, total, count, updateQty, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const DELIVERY_FEE = 20;
  const grandTotal = total + DELIVERY_FEE;
  const savings = cartItems.reduce((sum, i) => {
    const original = i.originalPrice || i.price;
    return sum + (original - i.price) * i.qty;
  }, 0);

  return (
    <div className="min-h-screen page-enter" style={{ paddingBottom: "calc(180px + env(safe-area-inset-bottom, 0px))" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl transition-all duration-200 active:scale-95 bg-[var(--surface)] shadow-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="font-display font-black tracking-tight text-2xl text-[var(--text-primary)] leading-none">
                Your Cart
              </h1>
              <p className="text-[13px] font-medium text-[var(--text-muted)] mt-1">
                {count} item{count !== 1 ? "s" : ""}{cartStore ? ` • ${cartStore.name}` : ""}
              </p>
            </div>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={() => { if (window.confirm("Clear all items from cart?")) clearCart(); }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95"
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* ── Empty State ──────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 gap-5">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,107,53,0.05))",
                border: "2px dashed rgba(255,107,53,0.25)",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              <ShoppingBag size={42} style={{ color: "var(--brand)", opacity: 0.7 }} />
            </div>
            <div className="text-center">
              <p className="font-display font-black text-2xl text-[var(--text-primary)]">Your cart is empty</p>
              <p className="text-sm font-medium text-[var(--text-muted)] mt-1.5">
                Browse stores and add items to get started
              </p>
            </div>
            <Link
              to="/user/home"
              className="btn mt-2 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
              style={{ background: "var(--brand)", color: "white" }}
            >
              <Sparkles size={16} /> Explore Stores
            </Link>
          </div>
        ) : (
          <>
            {/* ── Store Info Strip ────────────────────────── */}
            {cartStore && (
              <Link
                to={`/user/store/${cartStore._id}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl mb-4 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: "var(--elevated)", border: "1px solid var(--border)" }}
                >
                  {cartStore.image ? (
                    <img src={cartStore.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">🏪</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {cartStore.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {cartStore.deliveryTime || "20-30"} min delivery • Tap to add more
                  </p>
                </div>
                <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
              </Link>
            )}

            {/* ── Cart Items ─────────────────────────────── */}
            <div className="rounded-3xl overflow-hidden shadow-sm border border-[var(--border)] bg-[var(--surface)] mb-5">
              {cartItems.map((item, idx) => (
                <div key={item._id}>
                  <CartItem
                    item={item}
                    updateQty={updateQty}
                    removeFromCart={removeFromCart}
                    index={idx}
                  />
                  {idx !== cartItems.length - 1 && (
                    <div className="mx-4" style={{ borderBottom: "1px dashed var(--border)" }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Savings Banner ──────────────────────────── */}
            {savings > 0 && (
              <div
                className="flex items-center gap-3 p-3.5 rounded-2xl mb-5"
                style={{
                  background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.12)" }}
                >
                  <Percent size={16} style={{ color: "#22c55e" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: "#22c55e" }}>
                    You're saving ₹{savings.toFixed(0)}!
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    On this order compared to original prices
                  </p>
                </div>
              </div>
            )}

            {/* ── Coupon Nudge ────────────────────────────── */}
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-bold mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.04))",
                color: "#d97706",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              <Tag size={15} />
              <span>Have a coupon? Apply it at checkout to save more!</span>
            </div>

            {/* ── Bill Summary ────────────────────────────── */}
            <div className="rounded-3xl p-5 md:p-6 bg-[var(--surface)] shadow-sm border border-[var(--border)] mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
                Bill Summary
              </p>
              <div className="space-y-3 text-[13px] font-medium text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Item total ({count} item{count > 1 ? "s" : ""})</span>
                  <span className="text-[var(--text-primary)] font-bold">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="text-[var(--text-primary)] font-bold">₹{DELIVERY_FEE}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between" style={{ color: "#22c55e" }}>
                    <span>Discount</span>
                    <span className="font-bold">−₹{savings.toFixed(0)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-black text-lg pt-3 text-[var(--text-primary)]"
                  style={{ borderTop: "2px dashed var(--border)" }}
                >
                  <span>Grand Total</span>
                  <span>₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fixed Bottom CTA ───────────────────────────────── */}
      {cartItems.length > 0 && (
        <div
          className="fixed left-0 right-0 z-40 md:hidden"
          style={{
            bottom: "calc(56px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <div
            className="px-4 pt-3 pb-3"
            style={{
              background: "linear-gradient(to top, var(--bg) 70%, transparent)",
            }}
          >
            <button
              onClick={() => navigate("/checkout")}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] text-white shadow-xl"
              style={{
                background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
                boxShadow: "0 8px 32px rgba(255,107,53,0.35)",
              }}
            >
              <span>Proceed to Checkout</span>
              <span
                className="px-2.5 py-0.5 rounded-lg text-sm font-black"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                ₹{grandTotal.toFixed(0)}
              </span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop CTA — already visible in the bill summary section above */}
      {cartItems.length > 0 && (
        <div className="hidden md:block max-w-2xl mx-auto px-4">
          <button
            onClick={() => navigate("/checkout")}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] text-white shadow-lg hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #ff6b35, #ff8c5a)",
              boxShadow: "0 8px 24px rgba(255,107,53,0.25)",
            }}
          >
            Proceed to Checkout — ₹{grandTotal.toFixed(0)} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}