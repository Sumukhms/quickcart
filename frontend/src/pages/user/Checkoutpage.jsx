import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft, CreditCard, Banknote, Smartphone, Tag, CheckCircle,
  Zap, Lock, ChevronRight, X, Clock, Package, ArrowRight, Loader2,
  AlertCircle, ChevronDown, AlertTriangle,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { orderAPI, couponAPI, paymentAPI } from "../../api/api";
import { useRazorpay } from "../../hooks/useRazorpay";
import AddressManager from "../../components/address/AddressManager";
import { formatAddress } from "../../api/addressAPI";
import OrderSummary from "../../components/order/OrderSummary";

const PAYMENT_METHODS = [
  { id: "cod", label: "Cash on Delivery", sub: "Pay when your order arrives", icon: Banknote },
  { id: "upi", label: "UPI Payment", sub: "GPay, PhonePe, Paytm & more", icon: Smartphone },
  { id: "card", label: "Credit / Debit", sub: "All major cards accepted", icon: CreditCard },
];

const POST_ORDER_ROUTE = { customer: "/user/orders", store: "/user/orders", delivery: "/user/orders" };

function OrderSuccess({ order, onContinue }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 page-enter bg-[var(--bg)]">
      <div className="text-center max-w-sm w-full">
        <div className="relative mx-auto mb-6 w-28 h-28">
          <div className="w-28 h-28 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-500/10 border-4 border-green-100 dark:border-green-500/20 shadow-sm">
            <CheckCircle size={52} className="text-green-500" />
          </div>
        </div>
        <h1 className="font-display font-black tracking-tight text-3xl mb-2 text-[var(--text-primary)]">Order Placed!</h1>
        <p className="text-[15px] font-medium mb-6 text-[var(--text-secondary)]">Your order is confirmed</p>
        
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl mb-8 font-mono text-sm font-bold bg-[var(--elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-sm">
          #{order?._id?.slice(-8).toUpperCase()}
        </div>
        
        <div className="flex gap-3">
          <Link to={`/user/orders/${order._id}`} className="btn bg-[var(--text-primary)] text-[var(--surface)] flex-1 justify-center py-3.5 shadow-md active:scale-95 transition-all">
            Track Order
          </Link>
          <button onClick={onContinue} className="btn bg-[var(--elevated)] text-[var(--text-primary)] border border-[var(--border)] flex-1 justify-center py-3.5 active:scale-95 transition-all hover:bg-[var(--hover)]">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailableCoupons({ total, storeCategory, onApply }) {
  const [open, setOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = async () => {
    const next = !open;
    setOpen(next);
    if (!next || fetched) return;
    setLoading(true);
    try {
      const { data } = await couponAPI.list();
      const now = new Date();
      const valid = (Array.isArray(data) ? data : []).filter(
        (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now) &&
          total >= c.minOrderAmount && (c.usageLimit === null || c.usedCount < c.usageLimit) &&
          (c.applicableCategories.length === 0 || c.applicableCategories.includes(storeCategory)),
      );
      setCoupons(valid);
      setFetched(true);
    } catch { } finally { setLoading(false); }
  };

  const discountLabel = (c) => {
    if (c.discountType === "percent") return `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}`;
    if (c.discountType === "flat") return `₹${c.discountValue} flat off`;
    return "Free delivery";
  };

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={load}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-[13px] font-bold transition-all active:scale-[0.98] bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--hover)]"
      >
        <span className="flex items-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin text-[var(--brand)]" /> : <Tag size={14} className="text-[var(--text-primary)]" />}
          View available coupons
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-[var(--text-primary)]" /></div>
          ) : coupons.length === 0 ? (
            <p className="text-[13px] font-medium text-center py-5 text-[var(--text-muted)]">No coupons available for this order amount</p>
          ) : (
            coupons.map((c, i) => (
              <div key={c._id} className={`flex items-center gap-4 px-4 py-3.5 ${i !== coupons.length -1 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-[11px] font-mono tracking-wider px-2 py-0.5 rounded bg-[var(--text-primary)] text-[var(--surface)]">
                      {c.code}
                    </span>
                  </div>
                  <p className="text-[13px] font-black text-green-600 dark:text-green-500">
                    {discountLabel(c)} {c.minOrderAmount > 0 && <span className="text-[11px] font-medium text-[var(--text-muted)] ml-1">· Min ₹{c.minOrderAmount}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { onApply(c.code); setOpen(false); }}
                  className="shrink-0 text-xs font-bold px-4 py-2 rounded-lg transition-all active:scale-95 bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--hover)]"
                >
                  Apply
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StockWarningBanner({ message, available, onClearCart }) {
  return (
    <div className="rounded-2xl p-4 mb-6 flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 shadow-sm">
      <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-bold text-[15px] text-red-600 dark:text-red-400">Stock Issue</p>
        <p className="text-[13px] mt-0.5 font-medium text-red-600/80 dark:text-red-400/80">{message}</p>
        {available !== undefined && (
          <p className="text-xs mt-1.5 font-black text-amber-600 dark:text-amber-500">
            {available <= 0 ? "This item is out of stock" : `Only ${available} unit${available !== 1 ? "s" : ""} available`}
          </p>
        )}
      </div>
      <button onClick={onClearCart} className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 bg-red-100 text-red-600 dark:bg-red-500/20 transition-all active:scale-95 hover:bg-red-200">
        Update Cart
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { cartItems, cartStore, total, clearCart, addToast } = useCart();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const placingRef = useRef(false);

  const [step, setStep] = useState(1);
  const [selectedAddrObj, setSelectedAddrObj] = useState(null);
  const selectedAddr = selectedAddrObj ? formatAddress(selectedAddrObj) : "";

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [notes, setNotes] = useState("");
  const [stockError, setStockError] = useState(null);

  const { initiatePayment } = useRazorpay();

  const DELIVERY_FEE = 20;
  const freeDelivery = appliedCoupon?.freeDelivery ?? false;
  const couponDiscount = appliedCoupon && !freeDelivery ? appliedCoupon.discountAmount || 0 : 0;
  const effectiveDel = freeDelivery ? 0 : DELIVERY_FEE;
  const grandTotal = Math.max(0, total + effectiveDel - couponDiscount);

  const applyCoupon = useCallback(async (codeArg) => {
    const code = (typeof codeArg === "string" ? codeArg : couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true); setCouponError("");
    try {
      const { data } = await couponAPI.validate(code, total, cartStore?.category);
      setAppliedCoupon(data.coupon);
      setCouponInput("");
      addToast(`Coupon applied! ${data.coupon.description || "Discount applied"}`, "success");
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon code");
    } finally { setCouponLoading(false); }
  }, [couponInput, total, cartStore, addToast]);

  const placeOrder = useCallback(async () => {
    if (placingRef.current) return;
    if (!selectedAddrObj) { addToast("Please select a delivery address", "error"); return; }

    setStockError(null); placingRef.current = true; setPlacing(true);

    const serialisedItems = cartItems.map((item) => ({
      productId: item._id, name: item.name, price: item.price, quantity: item.qty, image: item.image || "",
    }));

    const orderData = {
      storeId: cartStore?._id, items: serialisedItems, totalPrice: grandTotal, deliveryAddress: selectedAddr,
      ...(selectedAddrObj?._id && String(selectedAddrObj._id).length === 24 ? { addressId: selectedAddrObj._id } : {}),
      paymentMethod, notes: notes?.trim() || undefined, couponCode: appliedCoupon?.code || undefined,
      deliveryLat: selectedAddrObj?.lat ?? null, deliveryLng: selectedAddrObj?.lng ?? null,
    };

    try {
      if (paymentMethod === "cod") {
        const { data } = await orderAPI.place(orderData);
        clearCart(); setPlacedOrder(data);
        return;
      }

      let rpOrder;
      try {
        const { data } = await paymentAPI.createOrder(grandTotal, cartItems.map((i) => ({ productId: i._id, quantity: i.qty })), appliedCoupon?.code);
        rpOrder = data;
      } catch (err) {
        const resData = err.response?.data;
        if (resData?.stockError || err.response?.status === 400) {
          setStockError({ message: resData?.message || "Stock issue detected", available: resData?.available });
          addToast(resData?.message || "Stock issue — please update your cart", "error"); return;
        }
        addToast(resData?.message || "Could not initiate payment. Please try again.", "error"); return;
      }

      let paymentResponse;
      try {
        paymentResponse = await initiatePayment({
          razorpayOrderId: rpOrder.razorpayOrderId, amount: rpOrder.amount, currency: rpOrder.currency, keyId: rpOrder.keyId,
          name: user?.name || "Customer", email: user?.email || "", contact: user?.phone || "", description: `Order from QuickCart`,
        });
      } catch (err) {
        if (err.message === "Payment cancelled by user") navigate(`/payment/failure?type=cancelled`);
        else navigate(`/payment/failure?type=failed&message=${encodeURIComponent(err.message)}`);
        return;
      }

      let order;
      try {
        const { data } = await paymentAPI.verify({
          razorpay_payment_id: paymentResponse.razorpay_payment_id, razorpay_order_id: paymentResponse.razorpay_order_id, razorpay_signature: paymentResponse.razorpay_signature, orderData,
        });
        order = data;
      } catch (err) {
        const resData = err.response?.data;
        if (resData?.stockError || resData?.needsRefund) {
          navigate(`/payment/failure?type=stock&orderId=${paymentResponse.razorpay_order_id}&paymentId=${paymentResponse.razorpay_payment_id}&message=${encodeURIComponent(resData.message)}`);
          return;
        }
        addToast(resData?.message || "Payment verification failed. Contact support.", "error"); return;
      }

      clearCart(); setPlacedOrder(order);
    } catch (e) { addToast(e.response?.data?.message || "Something went wrong.", "error"); } finally { placingRef.current = false; setPlacing(false); }
  }, [selectedAddrObj, selectedAddr, paymentMethod, notes, appliedCoupon, clearCart, addToast, cartItems, cartStore, grandTotal, user, initiatePayment, navigate]);

  if (placedOrder) return <OrderSuccess order={placedOrder} onContinue={() => navigate(POST_ORDER_ROUTE[user?.role] || "/user/orders")} />;
  if (!isLoggedIn) return (<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="text-center"><div className="text-6xl mb-4">🔐</div><h2 className="font-display font-black text-2xl mb-4 text-[var(--text-primary)]">Sign in to checkout</h2><Link to="/login" className="btn bg-[var(--text-primary)] text-[var(--surface)]">Sign In</Link></div></div>);
  if (cartItems.length === 0) return (<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="text-center"><div className="text-6xl mb-4">🛒</div><h2 className="font-display font-black text-2xl mb-4 text-[var(--text-primary)]">Your cart is empty</h2><Link to="/user/home" className="btn bg-[var(--text-primary)] text-[var(--surface)]">Browse Stores</Link></div></div>);

  return (
    <div className="min-h-screen page-enter bg-[var(--bg)] pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/user/cart" className="p-2.5 rounded-xl transition-all duration-200 active:scale-95 bg-[var(--surface)] shadow-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <ChevronLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-black tracking-tight text-2xl md:text-3xl text-[var(--text-primary)] leading-none">Checkout</h1>
            <p className="text-[13px] font-medium text-[var(--text-muted)] mt-1">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} • {cartStore?.name}
            </p>
          </div>
        </div>

        {stockError && <StockWarningBanner message={stockError.message} available={stockError.available} onClearCart={() => navigate("/user/cart")} />}

        {/* Step Indicator (Naked Monochrome style) */}
        <div className="flex items-center gap-0 mb-8 max-w-2xl">
          {["Address", "Payment", "Review"].map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <button onClick={() => step > i + 1 && setStep(i + 1)} className={`flex items-center gap-2.5 transition-all duration-300 ${step >= i + 1 ? "text-[var(--text-primary)] opacity-100" : "text-[var(--text-muted)] opacity-50"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-black shrink-0 ${step === i + 1 ? "bg-[var(--text-primary)] text-[var(--surface)] shadow-md scale-110" : step > i + 1 ? "bg-[var(--text-primary)] text-[var(--surface)]" : "bg-[var(--elevated)] border border-[var(--border)]"}`}>
                  {step > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className="text-[13px] font-bold hidden sm:block">{s}</span>
              </button>
              {i < 2 && <div className={`flex-1 mx-3 h-[2px] rounded-full transition-all duration-500 ${step > i + 1 ? "bg-[var(--text-primary)]" : "bg-[var(--border)]"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
          <div className="space-y-5">
            
            {/* ── STEP 1: ADDRESS ── */}
            <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${step === 1 ? "bg-[var(--surface)] shadow-sm border border-[var(--border)]" : "bg-transparent opacity-60"}`}>
              <button onClick={() => setStep(1)} className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors ${step === 1 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--elevated)] text-xl border border-[var(--border)] shadow-sm">📍</div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-lg text-[var(--text-primary)] tracking-tight">Delivery Address</p>
                  {step !== 1 && selectedAddr && <p className="text-[13px] font-medium text-[var(--text-muted)] truncate mt-0.5">{selectedAddr}</p>}
                </div>
                {step > 1 && <CheckCircle size={20} className="text-[var(--text-primary)]" />}
              </button>

              {step === 1 && (
                <div className="p-6 pt-4 animate-fade-in">
                  <AddressManager selected={selectedAddrObj?._id} onSelect={setSelectedAddrObj} showActions={false} />
                  <div className="mt-5">
                    <label className="text-[13px] font-bold mb-2 block text-[var(--text-primary)]">Delivery notes <span className="text-[var(--text-muted)] font-medium">(optional)</span></label>
                    <input className="input-theme text-[14px]" placeholder="e.g. Ring bell twice, 3rd floor" value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <button onClick={() => { if (!selectedAddrObj) { addToast("Select an address", "error"); return; } setStep(2); }} className="w-full mt-6 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-[var(--text-primary)] text-[var(--surface)] shadow-md active:scale-[0.98] transition-all hover:bg-gray-800 dark:hover:bg-gray-200">
                    Continue to Payment <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* ── STEP 2: PAYMENT ── */}
            <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${step === 2 ? "bg-[var(--surface)] shadow-sm border border-[var(--border)]" : "bg-transparent opacity-60 hidden md:block"}`}>
              <button onClick={() => step >= 2 && setStep(2)} className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors ${step === 2 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--elevated)] border border-[var(--border)] shadow-sm">
                  <CreditCard size={18} className="text-[var(--text-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="font-black text-lg text-[var(--text-primary)] tracking-tight">Payment Method</p>
                  {step > 2 && <p className="text-[13px] font-medium text-[var(--text-muted)] mt-0.5">{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</p>}
                </div>
                {step > 2 && <CheckCircle size={20} className="text-[var(--text-primary)]" />}
              </button>

              {step === 2 && (
                <div className="p-6 pt-4 space-y-4 animate-fade-in">
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map(({ id, label, sub, icon: Icon }) => (
                      <button key={id} onClick={() => { setPaymentMethod(id); setStockError(null); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.99] ${paymentMethod === id ? "bg-[var(--surface)] shadow-sm border-2 border-[var(--text-primary)]" : "bg-[var(--elevated)] border border-[var(--border)] hover:border-[var(--text-muted)]"}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === id ? "bg-[var(--text-primary)] text-[var(--surface)]" : "bg-[var(--surface)] text-[var(--text-secondary)] shadow-sm border border-[var(--border)]"}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold text-[15px] leading-tight ${paymentMethod === id ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{label}</p>
                          <p className="text-[12px] font-medium text-[var(--text-muted)] mt-0.5">{sub}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === id ? "border-[var(--text-primary)]" : "border-[var(--border)]"}`}>
                          {paymentMethod === id && <div className="w-2.5 h-2.5 rounded-full bg-[var(--text-primary)]" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <p className="text-[13px] font-bold text-[var(--text-primary)] mb-3">Coupons & Offers</p>
                    {appliedCoupon ? (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30">
                        <CheckCircle size={18} className="text-green-600 dark:text-green-500" />
                        <div className="flex-1">
                          <p className="text-[14px] font-black text-green-700 dark:text-green-400 leading-tight">{appliedCoupon.code}</p>
                          <p className="text-[12px] font-medium text-green-600 dark:text-green-500 mt-0.5">{freeDelivery ? "Free delivery applied!" : `₹${appliedCoupon.discountAmount} off`}</p>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); addToast("Coupon removed", "info"); }} className="p-1.5 rounded-lg bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <AvailableCoupons total={total} storeCategory={cartStore?.category} onApply={applyCoupon} />
                        <div className="flex gap-2">
                          <input className="input-theme text-[14px] flex-1 shadow-sm" placeholder="Enter coupon code" value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
                          <button onClick={() => applyCoupon()} disabled={couponLoading || !couponInput.trim()} className="btn bg-[var(--text-primary)] text-[var(--surface)] text-[14px] px-5 py-3 shrink-0 active:scale-95 shadow-sm">
                            {couponLoading ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                          </button>
                        </div>
                      </>
                    )}
                    {couponError && <div className="flex items-center gap-1.5 mt-2 text-[12px] font-bold text-red-500"><AlertCircle size={14} /> {couponError}</div>}
                  </div>

                  <button onClick={() => setStep(3)} className="w-full mt-2 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-[var(--text-primary)] text-[var(--surface)] shadow-md active:scale-[0.98] transition-all hover:bg-gray-800 dark:hover:bg-gray-200">
                    Review Order <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* ── STEP 3: REVIEW ── */}
            <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${step === 3 ? "bg-[var(--surface)] shadow-sm border border-[var(--border)]" : "bg-transparent opacity-60 hidden md:block"}`}>
              <button onClick={() => step >= 3 && setStep(3)} className={`w-full flex items-center gap-4 px-6 py-5 text-left transition-colors ${step === 3 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-[var(--elevated)] border border-[var(--border)] shadow-sm">
                  <Package size={18} className="text-[var(--text-primary)]" />
                </div>
                <p className="font-black text-lg text-[var(--text-primary)] tracking-tight">Review & Confirm</p>
              </button>

              {step === 3 && (
                <div className="p-6 pt-4 animate-fade-in">
                  <div className="rounded-2xl p-4 mb-5 space-y-2 text-[13px] font-medium bg-[var(--elevated)] border border-[var(--border)] text-[var(--text-secondary)] shadow-sm">
                    <p className="flex gap-2"><span className="text-base shrink-0 leading-none">📍</span> <span className="truncate">{selectedAddr}</span></p>
                    <p className="flex gap-2"><span className="text-base shrink-0 leading-none">💳</span> <span>{PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}</span></p>
                    {notes && <p className="flex gap-2"><span className="text-base shrink-0 leading-none">📝</span> <span className="truncate">{notes}</span></p>}
                  </div>

                  <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {cartItems.map((item) => (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-sm bg-[var(--elevated)] border border-[var(--border)]">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : "🛍️"}
                        </div>
                        <p className="flex-1 text-[14px] font-bold leading-tight text-[var(--text-primary)] truncate">{item.name}</p>
                        <span className="text-[12px] font-black px-2 py-1 rounded-lg bg-[var(--elevated)] text-[var(--text-muted)] shrink-0 border border-[var(--border)]">×{item.qty}</span>
                        <p className="text-[14px] font-black w-14 text-right text-[var(--text-primary)]">₹{item.price * item.qty}</p>
                      </div>
                    ))}
                  </div>

                  {stockError && (
                    <div className="rounded-xl p-3 mb-4 flex items-start gap-2 text-[13px] font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 shadow-sm">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <div>
                        <p>{stockError.message}</p>
                        <button onClick={() => navigate("/user/cart")} className="underline mt-0.5 font-black hover:text-red-700">Update cart →</button>
                      </div>
                    </div>
                  )}

                  <button onClick={placeOrder} disabled={placing} className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] bg-[var(--brand)] text-white shadow-[0_8px_24px_rgba(255,107,53,0.35)] hover:bg-[var(--brand-dark)] disabled:opacity-70">
                    {placing ? (
                      <><Loader2 size={20} className="animate-spin" /> {paymentMethod === "cod" ? "Placing order..." : "Verifying & charging..."}</>
                    ) : paymentMethod === "cod" ? (
                      <><Lock size={18} /> Place Order · ₹{grandTotal.toFixed(0)}</>
                    ) : (
                      <><Lock size={18} /> Pay ₹{grandTotal.toFixed(0)} via {paymentMethod === "upi" ? "UPI" : "Card"}</>
                    )}
                  </button>
                  <p className="text-center text-[11px] font-bold mt-3 text-[var(--text-muted)] uppercase tracking-wider">
                    {paymentMethod !== "cod" ? "✓ Stock verified before payment" : "✓ Secured checkout"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── ORDER SUMMARY SIDEBAR ── */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-3xl overflow-hidden bg-[var(--surface)] shadow-sm border border-[var(--border)]">
              <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-[var(--elevated)] border border-[var(--border)] shadow-sm">🏪</div>
                <div>
                  <p className="font-black text-[16px] text-[var(--text-primary)] leading-tight">{cartStore?.name || "Store"}</p>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-muted)] mt-1"><Clock size={12} /> {cartStore?.deliveryTime || "20–30 min"}</div>
                </div>
              </div>
              <OrderSummary
                items={cartItems.map((i) => ({ ...i, quantity: i.qty }))}
                subtotal={total} deliveryFee={DELIVERY_FEE} discount={appliedCoupon && !freeDelivery ? couponDiscount : 0}
                couponCode={appliedCoupon?.code} freeDelivery={freeDelivery} grandTotal={grandTotal} paymentMethod={paymentMethod}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}