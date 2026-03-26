import { useEffect } from "react";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function CartDrawer({ open, onClose }) {
  const { cartItems, cartStore, total, count, updateQty, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full z-50 flex flex-col w-full max-w-[420px] shadow-2xl transition-transform duration-400 ease-out`}
        style={{
          backgroundColor: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.12)" }}>
              <ShoppingBag size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <h2 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>Your Cart</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {count} item{count !== 1 ? "s" : ""}
                {cartStore && <> · {cartStore.name}</>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 pb-10">
              <div className="text-6xl" style={{ animation: "float 3s ease-in-out infinite" }}>🛒</div>
              <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>Cart is empty</p>
              <p className="text-sm text-center max-w-xs" style={{ color: "var(--text-muted)" }}>
                Add items from a store to get started
              </p>
              <button onClick={onClose} className="btn btn-brand text-sm">
                Browse Stores
              </button>
            </div>
          ) : (
            cartItems.map((item, i) => (
              <div key={item._id}
                className="flex gap-3 p-3 rounded-2xl group"
                style={{ background: "var(--card)", border: "1px solid var(--border)", animation: `slideUp 0.3s ease ${i * 50}ms both` }}>
                
                {/* Image */}
                <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden img-fallback"
                  style={{ background: "linear-gradient(135deg, var(--elevated), var(--card))" }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontSize: "1.5rem" }}>
                      {item.name?.[0] || "🛒"}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.unit || "1 piece"}</p>
                  <p className="font-bold text-sm mt-1" style={{ color: "var(--brand)" }}>
                    ₹{(item.price * item.qty).toFixed(0)}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all hover:scale-110"
                    style={{ color: "#ef4444" }}>
                    <Trash2 size={14} />
                  </button>

                  <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: "var(--elevated)" }}>
                    <button onClick={() => updateQty(item._id, item.qty - 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      style={{ background: "var(--card)", color: "var(--brand)" }}>
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {item.qty}
                    </span>
                    <button onClick={() => updateQty(item._id, item.qty + 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                      style={{ background: "var(--brand)", color: "white" }}>
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
            {/* Savings */}
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl"
              style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
              <span>🎉 You saved ₹45 on this order!</span>
              <span className="font-bold">15% off</span>
            </div>

            {/* Bill */}
            <div className="space-y-1.5 text-sm">
              {[
                { label: "Subtotal", val: `₹${total.toFixed(0)}` },
                { label: "Delivery fee", val: "₹20" },
                { label: "Platform fee", val: "₹5" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
                <span>Total</span>
                <span style={{ color: "var(--brand)" }}>₹{(total + 25).toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={() => { onClose(); navigate("/checkout"); }}
              className="btn btn-brand w-full justify-center text-base py-3.5">
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}