import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, MapPin, CreditCard, Banknote, Smartphone, Tag,
  ShoppingBag, CheckCircle, Zap, Lock, ChevronRight, X, Plus,
  Clock, Package, ArrowRight, Loader2, AlertCircle
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderAPI, couponAPI } from "../api/api";

const PAYMENT_METHODS = [
  { id: "cod",    label: "Cash on Delivery", sub: "Pay when your order arrives",  icon: Banknote,     color: "#22c55e" },
  { id: "upi",    label: "UPI Payment",       sub: "GPay, PhonePe, Paytm & more", icon: Smartphone,   color: "#3b82f6" },
  { id: "card",   label: "Credit / Debit",    sub: "All major cards accepted",    icon: CreditCard,   color: "#8b5cf6" },
];

function OrderSuccess({ order, onContinue }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="text-center max-w-sm w-full">
        <div className="relative mx-auto mb-6 w-28 h-28">
          <div className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.12)", border: "3px solid rgba(34,197,94,0.3)" }}>
            <CheckCircle size={52} style={{ color: "#22c55e" }} />
          </div>
          <div className="absolute -top-2 -right-2 text-2xl" style={{ animation: "float 2s ease-in-out infinite" }}>🎉</div>
        </div>
        <h1 className="font-display font-black text-3xl mb-2" style={{ color: "var(--text-primary)" }}>Order Placed!</h1>
        <p className="text-base mb-1" style={{ color: "var(--text-secondary)" }}>Your order is confirmed</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6 font-mono text-sm"
          style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
          #{order?._id?.slice(-8).toUpperCase()}
        </div>
        <div className="rounded-2xl p-4 mb-6 text-left"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.1)" }}>
              <Zap size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Estimated Delivery</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your rider is being assigned</p>
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
            <div className="h-full rounded-full" style={{ width: "25%", background: "var(--brand)" }} />
          </div>
          <div className="flex justify-between mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>Order placed</span>
            <span className="font-semibold" style={{ color: "var(--brand)" }}>20–30 min</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/user/orders/${order._id}`} className="btn btn-brand flex-1 justify-center py-3">
            Track Order <ArrowRight size={16} />
          </Link>
          <button onClick={onContinue} className="btn btn-ghost flex-1 justify-center py-3">Continue</button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const { cartItems, cartStore, total, clearCart, addToast } = useCart();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(user?.address || "");
  const [useCustomAddress, setUseCustomAddress] = useState(!user?.address);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [notes, setNotes] = useState("");

  const DELIVERY_FEE = 20;
  const couponDiscount = appliedCoupon
    ? (appliedCoupon.freeDelivery ? DELIVERY_FEE : appliedCoupon.discountAmount)
    : 0;
  const effectiveDelivery = appliedCoupon?.freeDelivery ? 0 : DELIVERY_FEE;
  const grandTotal = Math.max(0, total + effectiveDelivery - (appliedCoupon?.freeDelivery ? 0 : couponDiscount));

  const applyCoupon = useCallback(async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data } = await couponAPI.validate(code, total, cartStore?.category);
      setAppliedCoupon(data.coupon);
      setCouponInput("");
      addToast(`Coupon applied! ${data.coupon.description || "Discount applied"}`, "success");
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput, total, cartStore, addToast]);

  const placeOrder = useCallback(async () => {
    const deliveryAddr = address.trim();
    if (!deliveryAddr) { addToast("Please enter a delivery address", "error"); return; }
    setPlacing(true);
    try {
      const payload = {
        deliveryAddress: deliveryAddr,
        paymentMethod: ["cod", "online"].includes(paymentMethod) ? paymentMethod : "cod",
        notes: notes.trim() || undefined,
        couponCode: appliedCoupon?.code,
      };
      const { data } = await orderAPI.place(payload);
      clearCart();
      setPlacedOrder(data);
      addToast("Order placed successfully! 🎉", "success");
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to place order. Please try again.", "error");
    } finally {
      setPlacing(false);
    }
  }, [address, paymentMethod, notes, appliedCoupon, clearCart, addToast]);

  if (placedOrder) return <OrderSuccess order={placedOrder} onContinue={() => navigate("/user/home")} />;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Sign in to checkout</h2>
          <p className="mb-5" style={{ color: "var(--text-muted)" }}>You need to be logged in to place an order</p>
          <Link to="/login" className="btn btn-brand">Sign In</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>🛒</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Your cart is empty</h2>
          <p className="mb-5" style={{ color: "var(--text-muted)" }}>Add items before checking out</p>
          <Link to="/user/home" className="btn btn-brand">Browse Stores</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-enter" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/user/cart" className="p-2.5 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl" style={{ color: "var(--text-primary)" }}>Checkout</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} from {cartStore?.name || "Store"}
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 mb-6">
          {["Address", "Payment", "Review"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button onClick={() => step > i + 1 && setStep(i + 1)}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: step === i + 1 ? "var(--brand)" : step > i + 1 ? "#22c55e" : "var(--text-muted)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: step === i + 1 ? "var(--brand)" : step > i + 1 ? "#22c55e" : "var(--elevated)",
                    color: step >= i + 1 ? "white" : "var(--text-muted)",
                  }}>
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="hidden sm:block">{s}</span>
              </button>
              {i < 2 && (
                <div className="flex-1 mx-2 h-0.5 rounded-full"
                  style={{ background: step > i + 1 ? "#22c55e" : "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-5">
          <div className="space-y-4">

            {/* Step 1: Address */}
            <div className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1.5px solid ${step === 1 ? "var(--brand)" : "var(--border)"}` }}>
              <button onClick={() => setStep(1)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                style={{ borderBottom: step === 1 ? "1px solid var(--border)" : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: step === 1 ? "rgba(255,107,53,0.1)" : "var(--elevated)" }}>
                  <MapPin size={15} style={{ color: step === 1 ? "var(--brand)" : "var(--text-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Delivery Address</p>
                  {step !== 1 && address && (
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{address}</p>
                  )}
                </div>
                {step > 1 && <CheckCircle size={16} style={{ color: "#22c55e" }} />}
              </button>

              {step === 1 && (
                <div className="px-5 pb-5 pt-2 space-y-3">
                  {user?.address && (
                    <button onClick={() => { setAddress(user.address); setUseCustomAddress(false); }}
                      className="w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: !useCustomAddress ? "rgba(255,107,53,0.06)" : "var(--elevated)",
                        border: `1.5px solid ${!useCustomAddress ? "var(--brand)" : "var(--border)"}`,
                      }}>
                      <MapPin size={14} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
                      <div className="flex-1">
                        <p className="text-xs font-bold mb-0.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>SAVED ADDRESS</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.address}</p>
                      </div>
                    </button>
                  )}
                  <button onClick={() => setUseCustomAddress(true)}
                    className="flex items-center gap-2 text-sm font-semibold transition-all"
                    style={{ color: useCustomAddress ? "var(--brand)" : "var(--text-muted)" }}>
                    <Plus size={14} /> Add new address
                  </button>
                  {(useCustomAddress || !user?.address) && (
                    <textarea
                      className="input-theme text-sm resize-none"
                      rows={3}
                      placeholder="Enter your full delivery address including building, street, area, city..."
                      value={useCustomAddress ? address : ""}
                      onChange={e => setAddress(e.target.value)}
                    />
                  )}
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>
                      Delivery notes (optional)
                    </label>
                    <input className="input-theme text-sm" placeholder="e.g. Ring bell twice, 3rd floor"
                      value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <button onClick={() => {
                    if (!address.trim()) { addToast("Please enter a delivery address", "error"); return; }
                    setStep(2);
                  }} className="btn btn-brand w-full justify-center py-3">
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            <div className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1.5px solid ${step === 2 ? "var(--brand)" : "var(--border)"}`, opacity: step < 2 ? 0.6 : 1 }}>
              <button onClick={() => step >= 2 && setStep(2)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                style={{ borderBottom: step === 2 ? "1px solid var(--border)" : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: step === 2 ? "rgba(255,107,53,0.1)" : "var(--elevated)" }}>
                  <CreditCard size={15} style={{ color: step === 2 ? "var(--brand)" : "var(--text-muted)" }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Payment Method</p>
                  {step > 2 && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                    </p>
                  )}
                </div>
                {step > 2 && <CheckCircle size={16} style={{ color: "#22c55e" }} />}
              </button>

              {step === 2 && (
                <div className="px-5 pb-5 pt-2 space-y-3">
                  {PAYMENT_METHODS.map(({ id, label, sub, icon: Icon, color }) => (
                    <button key={id} onClick={() => setPaymentMethod(id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: paymentMethod === id ? "rgba(255,107,53,0.06)" : "var(--elevated)",
                        border: `1.5px solid ${paymentMethod === id ? "var(--brand)" : "var(--border)"}`,
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: color + "15" }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: paymentMethod === id ? "var(--brand)" : "var(--border)" }}>
                        {paymentMethod === id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--brand)" }} />}
                      </div>
                    </button>
                  ))}

                  {/* Coupon */}
                  <div className="pt-2">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                      <Tag size={11} className="inline mr-1" /> Coupon Code
                    </p>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                        <CheckCircle size={15} style={{ color: "#22c55e" }} />
                        <div className="flex-1">
                          <p className="text-sm font-bold" style={{ color: "#22c55e" }}>{appliedCoupon.code}</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {appliedCoupon.freeDelivery ? "Free delivery applied!" : `₹${appliedCoupon.discountAmount} off`}
                          </p>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); addToast("Coupon removed", "info"); }}
                          className="p-1 rounded-lg" style={{ color: "var(--text-muted)" }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          className="input-theme text-sm flex-1"
                          placeholder="Enter coupon code"
                          value={couponInput}
                          onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                          onKeyDown={e => e.key === "Enter" && applyCoupon()}
                        />
                        <button onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()}
                          className="btn btn-brand text-sm px-4 py-2.5 flex-shrink-0">
                          {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs" style={{ color: "#ef4444" }}>
                        <AlertCircle size={12} /> {couponError}
                      </div>
                    )}
                  </div>

                  <button onClick={() => setStep(3)} className="btn btn-brand w-full justify-center py-3">
                    Review Order <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Review */}
            <div className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1.5px solid ${step === 3 ? "var(--brand)" : "var(--border)"}`, opacity: step < 3 ? 0.6 : 1 }}>
              <button onClick={() => step >= 3 && setStep(3)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
                style={{ borderBottom: step === 3 ? "1px solid var(--border)" : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: step === 3 ? "rgba(255,107,53,0.1)" : "var(--elevated)" }}>
                  <Package size={15} style={{ color: step === 3 ? "var(--brand)" : "var(--text-muted)" }} />
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Review & Confirm</p>
              </button>

              {step === 3 && (
                <div className="px-5 pb-5 pt-2">
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {cartItems.map(item => (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 img-fallback text-sm"
                          style={{ background: "var(--elevated)" }}>
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : "🛍️"}
                        </div>
                        <p className="flex-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>{item.name}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>×{item.qty}</span>
                        <p className="text-sm font-bold w-16 text-right" style={{ color: "var(--text-primary)" }}>₹{item.price * item.qty}</p>
                      </div>
                    ))}
                  </div>

                  {/* Address & payment summary */}
                  <div className="rounded-xl p-3 mb-4 space-y-1 text-xs"
                    style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                    <p>📍 {address}</p>
                    <p>💳 {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                    {notes && <p>📝 {notes}</p>}
                  </div>

                  <button onClick={placeOrder} disabled={placing}
                    className="btn btn-brand w-full justify-center py-4 text-base"
                    style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.35)" }}>
                    {placing
                      ? <><Loader2 size={18} className="animate-spin" /> Placing order...</>
                      : <><Lock size={16} /> Place Order · ₹{grandTotal.toFixed(0)}</>}
                  </button>
                  <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    Secured & encrypted checkout
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "var(--elevated)" }}>🏪</div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{cartStore?.name || "Store"}</p>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Clock size={11} /> {cartStore?.deliveryTime || "20–30 min"}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 space-y-2.5 max-h-60 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item._id} className="flex justify-between items-center gap-2 text-sm">
                    <span className="truncate flex-1" style={{ color: "var(--text-secondary)" }}>
                      {item.name} × {item.qty}
                    </span>
                    <span className="font-semibold flex-shrink-0" style={{ color: "var(--text-primary)" }}>
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Delivery fee</span>
                  <span className="font-semibold" style={{ color: effectiveDelivery === 0 ? "#22c55e" : "var(--text-primary)" }}>
                    {effectiveDelivery === 0 ? "FREE" : `₹${effectiveDelivery}`}
                  </span>
                </div>
                {appliedCoupon && !appliedCoupon.freeDelivery && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "#22c55e" }}>Coupon ({appliedCoupon.code})</span>
                    <span className="font-semibold" style={{ color: "#22c55e" }}>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 mt-1 font-bold text-base"
                  style={{ borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-primary)" }}>Total</span>
                  <span style={{ color: "var(--brand)", fontSize: "1.2rem" }}>₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>

              {(appliedCoupon || couponDiscount > 0) ? (
                <div className="mx-4 mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold"
                  style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}>
                  🎉 You saved ₹{couponDiscount}!
                </div>
              ) : (
                <div className="mx-4 mb-4 px-4 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                  💡 Add a coupon code to save more
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}