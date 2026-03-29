/**
 * OrderSummary — reusable order bill breakdown component
 *
 * Props:
 *   items          {Array}   cart items: { name, price, quantity, image }
 *   subtotal       {number}
 *   deliveryFee    {number}  pass 0 for free delivery
 *   discount       {number}  coupon discount amount
 *   couponCode     {string}  applied coupon code (for label)
 *   freeDelivery   {bool}    if true shows "FREE" for delivery
 *   grandTotal     {number}
 *   paymentMethod  {string}  "cod" | "online"
 *   compact        {bool}    if true hides item list (orders list view)
 *   className      {string}
 *
 * Used in:
 *   - CheckoutPage (already inline — can optionally migrate)
 *   - UserTrack (tracking page)
 *   - UserOrders (order card footer)
 */
import { Tag, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const PAY_LABELS = {
  cod:    "💵 Cash on Delivery",
  online: "💳 Online Payment",
  upi:    "📱 UPI Payment",
  card:   "💳 Card Payment",
};

function LineItem({ label, value, highlight, strikeValue, sub }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-sm" style={{ color: highlight ? "#22c55e" : "var(--text-secondary)" }}>
        {label}
        {sub && <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>({sub})</span>}
      </span>
      <div className="flex items-center gap-1.5">
        {strikeValue && (
          <span className="text-xs line-through" style={{ color: "var(--text-muted)" }}>
            {strikeValue}
          </span>
        )}
        <span className="text-sm font-semibold" style={{ color: highlight ? "#22c55e" : "var(--text-primary)" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export default function OrderSummary({
  items = [],
  subtotal = 0,
  deliveryFee = 20,
  discount = 0,
  couponCode = "",
  freeDelivery = false,
  grandTotal,
  paymentMethod,
  compact = false,
  className = "",
}) {
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const effectiveDelivery = freeDelivery ? 0 : deliveryFee;
  const computedTotal =
    grandTotal !== undefined
      ? grandTotal
      : subtotal + effectiveDelivery - discount;

  const savings = discount + (freeDelivery ? deliveryFee : 0);

  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Items toggle (compact or expandable) */}
      {items.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setItemsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 transition-colors"
            style={{ borderBottom: itemsExpanded ? "1px solid var(--border)" : "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              style={{ color: "var(--text-muted)" }}>
              Items
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px]"
                style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
              >
                {items.reduce((s, i) => s + (i.quantity || i.qty || 1), 0)}
              </span>
            </span>
            {itemsExpanded ? (
              <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
            ) : (
              <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
            )}
          </button>

          {itemsExpanded && (
            <div
              className="px-4 py-3 space-y-2.5"
              style={{ borderBottom: "1px solid var(--border)", maxHeight: 240, overflowY: "auto" }}
            >
              {items.map((item, i) => {
                const qty = item.quantity || item.qty || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center text-sm"
                      style={{ background: "var(--elevated)" }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        "🛍️"
                      )}
                    </div>
                    <p className="flex-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                      {item.name}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
                    >
                      ×{qty}
                    </span>
                    <p className="text-sm font-semibold w-14 text-right" style={{ color: "var(--text-primary)" }}>
                      ₹{(item.price || 0) * qty}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Bill breakdown */}
      <div className="px-4 py-4 space-y-2.5">
        <LineItem label="Subtotal" value={`₹${subtotal.toFixed(0)}`} />
        <LineItem
          label="Delivery fee"
          value={effectiveDelivery === 0 ? "FREE" : `₹${effectiveDelivery}`}
          strikeValue={freeDelivery ? `₹${deliveryFee}` : undefined}
          highlight={effectiveDelivery === 0}
        />
        {discount > 0 && !freeDelivery && (
          <LineItem
            label="Coupon discount"
            sub={couponCode}
            value={`-₹${discount}`}
            highlight
          />
        )}

        <div
          className="flex justify-between items-center pt-3 font-bold"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span style={{ color: "var(--text-primary)" }}>Total Paid</span>
          <span style={{ color: "var(--brand)", fontSize: "1.15rem" }}>
            ₹{computedTotal.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Savings badge */}
      {savings > 0 && (
        <div
          className="mx-4 mb-4 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e" }}
        >
          <Tag size={11} />
          You saved ₹{savings} on this order!
        </div>
      )}

      {/* Payment method */}
      {paymentMethod && (
        <div
          className="px-4 pb-4 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {PAY_LABELS[paymentMethod] || paymentMethod}
        </div>
      )}
    </div>
  );
}