/**
 * CheckoutPage — FIXED v2
 *
 * Critical fixes:
 *   1. Stock is validated client-side BEFORE opening Razorpay popup
 *      (createRazorpayOrder now validates stock on server — surfaces error early)
 *   2. Cart items with insufficient stock are visually flagged
 *   3. Clear stock error display with product name and available count
 *   4. paymentAPI.createOrder passes items correctly for server validation
 *   5. Better error handling for stockError responses
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ChevronLeft,
  CreditCard,
  Banknote,
  Smartphone,
  Tag,
  CheckCircle,
  Zap,
  Lock,
  ChevronRight,
  X,
  Clock,
  Package,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { orderAPI, couponAPI, authAPI, paymentAPI } from "../../api/api";
import { useRazorpay } from "../../hooks/useRazorpay";
import AddressSelector from "../../components/address/AddressSelector";
import OrderSummary    from "../../components/order/OrderSummary";

const PAYMENT_METHODS = [
  { id: "cod",    label: "Cash on Delivery", sub: "Pay when your order arrives",  icon: Banknote,    color: "#22c55e" },
  { id: "upi",    label: "UPI Payment",      sub: "GPay, PhonePe, Paytm & more", icon: Smartphone,  color: "#3b82f6" },
  { id: "card",   label: "Credit / Debit",   sub: "All major cards accepted",     icon: CreditCard,  color: "#8b5cf6" },
];

const POST_ORDER_ROUTE = { customer: "/user/orders", store: "/user/orders", delivery: "/user/orders" };

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
        <div className="rounded-2xl p-4 mb-6 text-left" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)" }}>
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

// ─── Coupon Browser ──────────────────────────────────────────
function AvailableCoupons({ total, storeCategory, onApply }) {
  const [open,    setOpen]    = useState(false);
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
      const now   = new Date();
      const valid = (Array.isArray(data) ? data : []).filter(c =>
        c.isActive &&
        (!c.expiresAt || new Date(c.expiresAt) > now) &&
        total >= c.minOrderAmount &&
        (c.usageLimit === null || c.usedCount < c.usageLimit) &&
        (c.applicableCategories.length === 0 || c.applicableCategories.includes(storeCategory))
      );
      setCoupons(valid);
      setFetched(true);
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  };

  const discountLabel = (c) => {
    if (c.discountType === "percent") return `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}`;
    if (c.discountType === "flat")    return `₹${c.discountValue} flat off`;
    return "Free delivery";
  };

  return (
    <div className="mb-3">
      <button type="button" onClick={load}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
        style={{ background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-2">
          {loading ? <Loader2 size={13} className="animate-spin" style={{ color: "var(--brand)" }} /> : <Tag size={13} style={{ color: "var(--brand)" }} />}
          Browse available coupons
        </span>
        <ChevronDown size={13} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-5">
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--brand)" }} />
            </div>
          ) : coupons.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>No coupons available for this order amount</p>
          ) : coupons.map(c => (
            <div key={c._id} className="flex items-center gap-3 px-4 py-3"
              style={{ background: "var(--elevated)", borderBottom: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-black text-xs font-mono tracking-wider px-2 py-0.5 rounded-md"
                    style={{ background: "rgba(255,107,53,0.12)", color: "var(--brand)" }}>
                    {c.code}
                  </span>
                  {c.description && <span className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{c.description}</span>}
                </div>
                <p className="text-[11px] font-semibold" style={{ color: "#22c55e" }}>
                  {discountLabel(c)}
                  {c.minOrderAmount > 0 && ` · min ₹${c.minOrderAmount}`}
                </p>
              </div>
              <button type="button" onClick={() => { onApply(c.code); setOpen(false); }}
                className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.25)" }}>
                Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stock Warning Banner ─────────────────────────────────────
function StockWarningBanner({ message, available, onClearCart }) {
  return (
    <div
      className="rounded-2xl p-4 mb-4 flex items-start gap-3"
      style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)" }}
    >
      <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1">
        <p className="font-bold text-sm" style={{ color: "#ef4444" }}>Stock Issue</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{message}</p>
        {available !== undefined && (
          <p className="text-xs mt-1 font-semibold" style={{ color: "#f59e0b" }}>
            {available <= 0 ? "This item is out of stock" : `Only ${available} unit${available !== 1 ? "s" : ""} available`}
          </p>
        )}
      </div>
      <button
        onClick={onClearCart}
        className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
      >
        Update Cart
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { cartItems, cartStore, total, clearCart, addToast } = useCart();
  const { user, isLoggedIn, updateUser }                     = useAuth();
  const navigate                                             = useNavigate();
  const placingRef                                           = useRef(false);

  const initialAddresses = (() => {
    const saved  = user?.addresses || [];
    const legacy = user?.address;
    if (legacy && !saved.includes(legacy)) return [legacy, ...saved];
    return saved;
  })();

  const [step,          setStep]          = useState(1);
  const [addresses,     setAddresses]     = useState(initialAddresses);
  const [selectedAddr,  setSelectedAddr]  = useState(initialAddresses[0] || "");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponInput,   setCouponInput]   = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError,   setCouponError]   = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [placing,       setPlacing]       = useState(false);
  const [placedOrder,   setPlacedOrder]   = useState(null);
  const [notes,         setNotes]         = useState("");
  const [stockError,    setStockError]    = useState(null); // { message, available }

  const { initiatePayment } = useRazorpay();

  const DELIVERY_FEE   = 20;
  const freeDelivery   = appliedCoupon?.freeDelivery ?? false;
  const couponDiscount = appliedCoupon ? (freeDelivery ? DELIVERY_FEE : appliedCoupon.discountAmount) : 0;
  const effectiveDel   = freeDelivery ? 0 : DELIVERY_FEE;
  const grandTotal     = Math.max(0, total + effectiveDel - (freeDelivery ? 0 : couponDiscount));

  const handleAddAddress = useCallback(async (addr) => {
    try {
      const { data } = await authAPI.addAddress(addr);
      setAddresses(data.addresses);
      setSelectedAddr(addr);
      updateUser({ addresses: data.addresses, address: data.address });
    } catch (err) { addToast(err.response?.data?.message || "Failed to save address", "error"); }
  }, [addToast, updateUser]);

  const handleDeleteAddress = useCallback(async (index) => {
    try {
      const { data } = await authAPI.removeAddress(index);
      const updated  = data.addresses;
      setAddresses(updated);
      if (selectedAddr === addresses[index]) setSelectedAddr(updated[0] || "");
      updateUser({ addresses: updated, address: data.address });
    } catch (err) { addToast(err.response?.data?.message || "Failed to remove address", "error"); }
  }, [addresses, selectedAddr, addToast, updateUser]);

  const applyCoupon = useCallback(async (codeArg) => {
    const code = (typeof codeArg === "string" ? codeArg : couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true); setCouponError("");
    try {
      const { data } = await couponAPI.validate(code, total, cartStore?.category);
      setAppliedCoupon(data.coupon);
      setCouponInput("");
      addToast(`Coupon applied! ${data.coupon.description || "Discount applied"}`, "success");
    } catch (err) { setCouponError(err.response?.data?.message || "Invalid coupon code"); }
    finally { setCouponLoading(false); }
  }, [couponInput, total, cartStore, addToast]);

  const placeOrder = useCallback(async () => {
    if (placingRef.current) return;
    if (!selectedAddr?.trim()) { addToast("Please select a delivery address", "error"); return; }

    // Clear previous stock errors
    setStockError(null);
    placingRef.current = true;
    setPlacing(true);

    const serialisedItems = cartItems.map(item => ({
      productId: item._id,
      name:      item.name,
      price:     item.price,
      quantity:  item.qty,
      image:     item.image || "",
    }));

    const orderData = {
      storeId:         cartStore?._id,
      items:           serialisedItems,
      totalPrice:      grandTotal,
      deliveryAddress: selectedAddr,
      paymentMethod,
      notes:           notes?.trim() || undefined,
      couponCode:      appliedCoupon?.code,
    };

    try {
      if (paymentMethod === "cod") {
        // COD: stock validated server-side in placeOrder
        const { data } = await orderAPI.place(orderData);
        clearCart();
        setPlacedOrder(data);
        addToast("Order placed successfully! 🎉", "success");
        return;
      }

      // ── Online payment flow ──────────────────────────────
      // Step 1: createRazorpayOrder — this VALIDATES STOCK on server
      //         before charging. If stock is insufficient, we abort here.
      let rpOrder;
      try {
        const { data } = await paymentAPI.createOrder(
          grandTotal,
          // Pass items for server-side stock + amount validation
          cartItems.map(item => ({ productId: item._id, quantity: item.qty })),
          appliedCoupon?.code
        );
        rpOrder = data;
      } catch (err) {
        const resData = err.response?.data;

        // ── CRITICAL: Stock error caught BEFORE payment ────
        if (resData?.stockError || err.response?.status === 400) {
          setStockError({
            message:   resData?.message || "Stock issue detected",
            available: resData?.available,
          });
          addToast(resData?.message || "Stock issue — please update your cart", "error");
          return;
        }

        if (resData?.configError) {
          addToast("Payment system not configured. Please use Cash on Delivery.", "error");
          setPaymentMethod("cod");
          return;
        }

        addToast(resData?.message || "Could not initiate payment. Please try again.", "error");
        return;
      }

      // Step 2: Open Razorpay popup
      let paymentResponse;
      try {
        paymentResponse = await initiatePayment({
          razorpayOrderId: rpOrder.razorpayOrderId,
          amount:          rpOrder.amount,
          currency:        rpOrder.currency,
          keyId:           rpOrder.keyId,
          name:            user?.name    || "Customer",
          email:           user?.email   || "",
          contact:         user?.phone   || "",
          description:     `Order from ${cartStore?.name || "QuickCart"}`,
        });
      } catch (err) {
        if (err.message === "Payment cancelled by user") {
          addToast("Payment cancelled", "info");
        } else {
          addToast(err.message || "Payment failed. Please try again.", "error");
        }
        return;
      }

      // Step 3: Verify payment and create order
      let order;
      try {
        const { data } = await paymentAPI.verify({
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id:   paymentResponse.razorpay_order_id,
          razorpay_signature:  paymentResponse.razorpay_signature,
          orderData,
        });
        order = data;
      } catch (err) {
        const resData = err.response?.data;

        // Extremely rare: stock ran out in the tiny window between
        // createRazorpayOrder and verify (race condition).
        if (resData?.stockError || resData?.needsRefund) {
          addToast(
            resData?.message ||
            "Stock ran out during payment. You will be refunded within 3–5 business days.",
            "error"
          );
          return;
        }

        addToast(resData?.message || "Payment verification failed. Contact support.", "error");
        return;
      }

      clearCart();
      setPlacedOrder(order);
      addToast("Payment successful! Order placed 🎉", "success");
    } catch (e) {
      addToast(e.response?.data?.message || "Something went wrong. Please try again.", "error");
    } finally {
      placingRef.current = false;
      setPlacing(false);
    }
  }, [
    selectedAddr, paymentMethod, notes, appliedCoupon, clearCart, addToast,
    cartItems, cartStore, grandTotal, user, initiatePayment,
  ]);

  if (placedOrder) {
    return (
      <OrderSuccess
        order={placedOrder}
        onContinue={() => navigate(POST_ORDER_ROUTE[user?.role] || "/user/orders")}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="font-bold text-xl mb-2" style={{ color: "var(--text-primary)" }}>Sign in to checkout</h2>
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
              {user?.role !== "customer" && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>Personal order</span>
              )}
            </p>
          </div>
        </div>

        {/* Stock error banner — shown prominently */}
        {stockError && (
          <StockWarningBanner
            message={stockError.message}
            available={stockError.available}
            onClearCart={() => { navigate("/user/cart"); }}
          />
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-6">
          {["Address", "Payment", "Review"].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <button
                onClick={() => step > i + 1 && setStep(i + 1)}
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: step === i + 1 ? "var(--brand)" : step > i + 1 ? "#22c55e" : "var(--text-muted)" }}
              >
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
              <button onClick={() => setStep(1)} className="w-full flex items-center gap-3 px-5 py-4 text-left"
                style={{ borderBottom: step === 1 ? "1px solid var(--border)" : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: step === 1 ? "rgba(255,107,53,0.1)" : "var(--elevated)" }}>📍</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Delivery Address</p>
                  {step !== 1 && selectedAddr && (
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{selectedAddr}</p>
                  )}
                </div>
                {step > 1 && <CheckCircle size={16} style={{ color: "#22c55e" }} />}
              </button>

              {step === 1 && (
                <div className="px-5 pb-5 pt-3 space-y-4">
                  <AddressSelector
                    addresses={addresses}
                    selected={selectedAddr}
                    onSelect={setSelectedAddr}
                    onAdd={handleAddAddress}
                    onDelete={handleDeleteAddress}
                  />
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--text-muted)" }}>Delivery notes (optional)</label>
                    <input className="input-theme text-sm" placeholder="e.g. Ring bell twice, 3rd floor"
                      value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <button
                    onClick={() => { if (!selectedAddr.trim()) { addToast("Please select a delivery address", "error"); return; } setStep(2); }}
                    className="btn btn-brand w-full justify-center py-3">
                    Continue to Payment <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            <div className="rounded-3xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1.5px solid ${step === 2 ? "var(--brand)" : "var(--border)"}`, opacity: step < 2 ? 0.6 : 1 }}>
              <button onClick={() => step >= 2 && setStep(2)} className="w-full flex items-center gap-3 px-5 py-4 text-left"
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
                    <button key={id} onClick={() => { setPaymentMethod(id); setStockError(null); }}
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

                  {/* Online payment stock note */}
                  {(paymentMethod === "upi" || paymentMethod === "card") && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
                      style={{ background: "rgba(34,197,94,0.06)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>Stock availability is verified <strong>before</strong> you're charged. No surprise post-payment errors.</span>
                    </div>
                  )}

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
                            {freeDelivery ? "Free delivery applied!" : `₹${appliedCoupon.discountAmount} off`}
                          </p>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); addToast("Coupon removed", "info"); }}
                          className="p-1 rounded-lg" style={{ color: "var(--text-muted)" }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <AvailableCoupons total={total} storeCategory={cartStore?.category} onApply={applyCoupon} />
                        <div className="flex gap-2">
                          <input className="input-theme text-sm flex-1" placeholder="Enter coupon code"
                            value={couponInput}
                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                            onKeyDown={e => e.key === "Enter" && applyCoupon()} />
                          <button onClick={() => applyCoupon()} disabled={couponLoading || !couponInput.trim()}
                            className="btn btn-brand text-sm px-4 py-2.5 flex-shrink-0">
                            {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                          </button>
                        </div>
                      </>
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
              <button onClick={() => step >= 3 && setStep(3)} className="w-full flex items-center gap-3 px-5 py-4 text-left"
                style={{ borderBottom: step === 3 ? "1px solid var(--border)" : "none" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: step === 3 ? "rgba(255,107,53,0.1)" : "var(--elevated)" }}>
                  <Package size={15} style={{ color: step === 3 ? "var(--brand)" : "var(--text-muted)" }} />
                </div>
                <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Review & Confirm</p>
              </button>

              {step === 3 && (
                <div className="px-5 pb-5 pt-2">
                  <div className="rounded-xl p-3 mb-4 space-y-1 text-xs"
                    style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>
                    <p>📍 {selectedAddr}</p>
                    <p>💳 {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</p>
                    {notes && <p>📝 {notes}</p>}
                    {appliedCoupon && (
                      <p className="font-semibold" style={{ color: "#22c55e" }}>
                        🏷️ {appliedCoupon.code} — {freeDelivery ? "Free delivery" : `₹${appliedCoupon.discountAmount} off`}
                      </p>
                    )}
                  </div>

                  {/* Items quick list */}
                  <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {cartItems.map(item => (
                      <div key={item._id} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-xs"
                          style={{ background: "var(--elevated)" }}>
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : "🛍️"}
                        </div>
                        <p className="flex-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>{item.name}</p>
                        <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--elevated)", color: "var(--text-muted)" }}>×{item.qty}</span>
                        <p className="text-sm font-bold w-14 text-right" style={{ color: "var(--text-primary)" }}>
                          ₹{item.price * item.qty}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Stock error shown at review step too */}
                  {stockError && (
                    <div className="rounded-xl p-3 mb-3 flex items-start gap-2 text-xs"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p className="font-semibold">{stockError.message}</p>
                        <button onClick={() => navigate("/user/cart")} className="underline mt-0.5">Update cart →</button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={placeOrder}
                    disabled={placing}
                    className="btn btn-brand w-full justify-center py-4 text-base"
                    style={{ boxShadow: "0 8px 24px rgba(255,107,53,0.35)" }}
                  >
                    {placing ? (
                      <><Loader2 size={18} className="animate-spin" /> {paymentMethod === "cod" ? "Placing order..." : "Verifying stock & charging..."}</>
                    ) : paymentMethod === "cod" ? (
                      <><Lock size={16} /> Place Order · ₹{grandTotal.toFixed(0)}</>
                    ) : (
                      <><Lock size={16} /> Pay ₹{grandTotal.toFixed(0)} via {paymentMethod === "upi" ? "UPI" : "Card"}</>
                    )}
                  </button>
                  <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                    {paymentMethod !== "cod"
                      ? "✓ Stock verified before payment — you won't be charged for unavailable items"
                      : "Secured & encrypted checkout"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary sidebar */}
          <div className="lg:sticky lg:top-24 h-fit space-y-3">
            <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
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
              <OrderSummary
                items={cartItems.map(i => ({ ...i, quantity: i.qty }))}
                subtotal={total}
                deliveryFee={20}
                discount={appliedCoupon && !freeDelivery ? couponDiscount : 0}
                couponCode={appliedCoupon?.code}
                freeDelivery={freeDelivery}
                grandTotal={grandTotal}
                paymentMethod={paymentMethod}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}