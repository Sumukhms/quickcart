import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, ChevronLeft } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function UserCart() {
  const { cartItems, cartStore, total, count, updateQty, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Your Cart</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {count} item{count !== 1 ? "s" : ""}{cartStore ? ` · ${cartStore.name}` : ""}
            </p>
          </div>
          {cartItems.length > 0 && (
            <button onClick={clearCart} className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
              Clear
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-7xl" style={{ animation: "float 3s ease-in-out infinite" }}>🛒</div>
            <p className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>Your cart is empty</p>
            <p style={{ color: "var(--text-muted)" }}>Browse stores and add items to get started</p>
            <Link to="/user/home" className="btn btn-brand">Browse Stores</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cartItems.map(item => (
                <div key={item._id} className="flex gap-3 p-4 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden img-fallback"
                    style={{ background: "var(--elevated)" }}>
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span style={{ fontSize: "1.5rem" }}>🛍️</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.unit || "1 piece"}</p>
                    <p className="font-bold text-sm mt-1" style={{ color: "var(--brand)" }}>₹{(item.price * item.qty).toFixed(0)}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeFromCart(item._id)} className="p-1 rounded-lg transition-all hover:scale-110" style={{ color: "#ef4444" }}>
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: "var(--elevated)" }}>
                      <button onClick={() => item.qty === 1 ? removeFromCart(item._id) : updateQty(item._id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                        style={{ background: "var(--card)", color: "var(--brand)" }}>
                        <Minus size={13} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty + 1)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white transition-all hover:scale-110"
                        style={{ background: "var(--brand)" }}>
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill */}
            <div className="rounded-3xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                <Tag size={12} /> Add coupon at checkout to save more
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Subtotal", val: `₹${total.toFixed(0)}` },
                  { label: "Delivery fee", val: "₹20" },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between" style={{ color: "var(--text-secondary)" }}>
                    <span>{label}</span><span className="font-medium">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base pt-2"
                  style={{ borderTop: "1px solid var(--border)", color: "var(--text-primary)" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--brand)" }}>₹{(total + 20).toFixed(0)}</span>
                </div>
              </div>
              <button onClick={() => navigate("/checkout")} className="btn btn-brand w-full justify-center text-base py-3.5 mt-4">
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
