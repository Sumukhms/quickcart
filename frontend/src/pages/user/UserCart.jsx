import { useNavigate, Link } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, Tag, ChevronLeft } from "lucide-react";
import { useCart } from "../../context/CartContext";

export default function UserCart() {
  const { cartItems, cartStore, total, count, updateQty, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen page-enter pb-24" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
              onClick={clearCart}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 transition-all active:scale-95"
            >
              Clear
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-7xl drop-shadow-sm" style={{ animation: "float 3s ease-in-out infinite" }}>🛒</div>
            <p className="font-display font-black text-2xl text-[var(--text-primary)]">Your cart is empty</p>
            <p className="text-sm font-medium text-[var(--text-muted)]">Browse stores and add items to get started</p>
            <Link to="/user/home" className="btn bg-[var(--text-primary)] text-[var(--surface)] mt-4 shadow-md active:scale-95 transition-all">
              Browse Stores
            </Link>
          </div>
        ) : (
          <>
            {/* Naked Unified List for Cart Items */}
            <div className="mb-6 bg-[var(--surface)] rounded-3xl shadow-sm border border-[var(--border)] overflow-hidden">
              {cartItems.map((item, idx) => (
                <div
                  key={item._id}
                  className={`flex gap-4 p-4 ${idx !== cartItems.length - 1 ? "border-b border-[var(--border)]" : ""}`}
                >
                  <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden bg-[var(--elevated)] flex items-center justify-center text-2xl border border-[var(--border)]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; e.target.parentNode.textContent = "🛍️"; }} />
                    ) : "🛍️"}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="font-bold text-[15px] leading-tight text-[var(--text-primary)] truncate">{item.name}</p>
                    <p className="text-[12px] font-medium text-[var(--text-muted)] mt-1">{item.unit || "1 piece"}</p>
                    <p className="font-black text-[15px] mt-1 text-[var(--text-primary)]">
                      ₹{(item.price * item.qty).toFixed(0)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="p-1 rounded-lg transition-all active:scale-90 text-[var(--text-muted)] hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                    
                    <div className="flex items-center gap-3 bg-[var(--elevated)] rounded-xl p-1 border border-[var(--border)]">
                      <button
                        onClick={() => item.qty === 1 ? removeFromCart(item._id) : updateQty(item._id, item.qty - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                      >
                        <Minus size={14} strokeWidth={2.5} />
                      </button>
                      <span className="w-4 text-center text-sm font-bold text-[var(--text-primary)]">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item._id, item.qty + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 bg-[var(--text-primary)] text-[var(--surface)] shadow-sm"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Bill Summary */}
            <div className="rounded-3xl p-5 md:p-6 bg-[var(--surface)] shadow-sm border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-xl text-xs font-bold bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-100 dark:border-green-500/20">
                <Tag size={14} /> Add a coupon at checkout to save more
              </div>
              
              <div className="space-y-3 text-[13px] font-medium text-[var(--text-secondary)]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-[var(--text-primary)] font-bold">₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery fee</span>
                  <span className="text-[var(--text-primary)] font-bold">₹20</span>
                </div>
                <div className="flex justify-between font-black text-lg pt-3 border-t border-[var(--border)] text-[var(--text-primary)]">
                  <span>Total</span>
                  <span>₹{(total + 20).toFixed(0)}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-[var(--brand)] text-white shadow-md hover:bg-[var(--brand-dark)]"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}