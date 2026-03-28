/**
 * orderFlows.js  (frontend)
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for category-based order flows on the
 * React side. Mirrors the logic inlined in orderController.js
 * on the backend — keep both in sync if you ever change flows.
 *
 * Exports used by:
 *   • UserTrack.jsx        — dynamic timeline (5 vs 6 steps)
 *   • StoreDashboard.jsx   — "next status" button label
 *   • StoreOrders.jsx      — "next status" button label
 *   • DeliveryDashboard.jsx — available-order badge label
 */

// ─── Which categories use the food flow ───────────────────────
export const FOOD_CATEGORIES = ["Food"];

export function getFlowType(storeCategory) {
  return FOOD_CATEGORIES.includes(storeCategory) ? "food" : "grocery";
}

// ─── Ordered sequences ────────────────────────────────────────
export const FLOW_SEQUENCES = {
  food: [
    "pending",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "out_for_delivery",
    "delivered",
  ],
  grocery: [
    "pending",
    "confirmed",
    "packing",
    "out_for_delivery",
    "delivered",
  ],
};

/** Returns index of a status in the flow, or -1 */
export function getStatusIndex(status, storeCategory) {
  const seq = FLOW_SEQUENCES[getFlowType(storeCategory)];
  return seq.indexOf(status);
}

/** Returns next status in the flow, or null at terminal states */
export function getNextStatus(currentStatus, storeCategory) {
  const seq = FLOW_SEQUENCES[getFlowType(storeCategory)];
  const idx = seq.indexOf(currentStatus);
  if (idx === -1 || idx === seq.length - 1) return null;
  return seq[idx + 1];
}

// ─── Status display config ────────────────────────────────────
// All possible statuses that can ever appear in the UI

/** colour + emoji used in tags/badges throughout the UI */
export const STATUS_VISUAL = {
  pending:          { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  emoji: "⏳", label: "Pending" },
  confirmed:        { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  emoji: "✅", label: "Confirmed" },
  preparing:        { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)",  emoji: "👨‍🍳", label: "Preparing" },
  packing:          { color: "#06b6d4", bg: "rgba(6,182,212,0.12)",   emoji: "📦", label: "Packing" },
  ready_for_pickup: { color: "#f97316", bg: "rgba(249,115,22,0.12)",  emoji: "🛍️", label: "Ready for Pickup" },
  out_for_delivery: { color: "#ff6b35", bg: "rgba(255,107,53,0.12)",  emoji: "🛵", label: "Out for Delivery" },
  delivered:        { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   emoji: "🎉", label: "Delivered" },
  cancelled:        { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   emoji: "❌", label: "Cancelled" },
};

// ─── Timeline step definitions (for UserTrack) ────────────────
// Each entry: { key, label, sub }  — icon is added in the component

const TIMELINE_STEPS = {
  // ── Food flow ─────────────────────────────────────────────
  food: [
    {
      key:   "pending",
      label: "Order Placed",
      sub:   "Restaurant received your order",
    },
    {
      key:   "confirmed",
      label: "Confirmed",
      sub:   "Restaurant confirmed your order",
    },
    {
      key:   "preparing",
      label: "Preparing Food",
      sub:   "Chef is cooking your meal",
    },
    {
      key:   "ready_for_pickup",
      label: "Ready for Pickup",
      sub:   "Food is ready — finding a delivery partner",
    },
    {
      key:   "out_for_delivery",
      label: "Out for Delivery",
      sub:   "Rider is heading to you with your food",
    },
    {
      key:   "delivered",
      label: "Delivered",
      sub:   "Enjoy your meal! 🎉",
    },
  ],
  // ── Grocery / default flow ────────────────────────────────
  grocery: [
    {
      key:   "pending",
      label: "Order Placed",
      sub:   "Store received your order",
    },
    {
      key:   "confirmed",
      label: "Confirmed",
      sub:   "Store confirmed your order",
    },
    {
      key:   "packing",
      label: "Packing Items",
      sub:   "Staff is carefully packing your items",
    },
    {
      key:   "out_for_delivery",
      label: "Out for Delivery",
      sub:   "Rider is heading to you with your order",
    },
    {
      key:   "delivered",
      label: "Delivered",
      sub:   "Your order has arrived! 🎉",
    },
  ],
};

/**
 * Get the full timeline step array for UserTrack.
 * The component merges these with its static icon/colour config.
 */
export function getTimelineSteps(storeCategory) {
  return TIMELINE_STEPS[getFlowType(storeCategory)];
}

/**
 * Get label + sub for a single status + category combination.
 * Used in the live-status banner in UserTrack.
 */
export function getStatusMessage(status, storeCategory) {
  const steps = getTimelineSteps(storeCategory);
  const match = steps.find(s => s.key === status);
  if (match) return { label: match.label, sub: match.sub };
  // Fallback for cancelled (not in timeline)
  const vis = STATUS_VISUAL[status];
  return {
    label: vis?.label || status,
    sub:   "Your order status has been updated",
  };
}

// ─── Store dashboard helpers ──────────────────────────────────

/**
 * Label for the "advance to next status" button in store dashboards.
 * Returns null when there is no next step (terminal or unrecognised).
 *
 * @param {string} currentStatus
 * @param {string} storeCategory
 * @returns {string|null}  e.g. "→ Preparing Food"
 */
export function getNextStatusButtonLabel(currentStatus, storeCategory) {
  const next = getNextStatus(currentStatus, storeCategory);
  if (!next) return null;
  const vis = STATUS_VISUAL[next];
  return vis ? `→ ${vis.label}` : `→ ${next}`;
}

/**
 * Full config for the next-step button: label + next status key.
 * Returns null when there is no valid next step.
 */
export function getNextStatusAction(currentStatus, storeCategory) {
  const next = getNextStatus(currentStatus, storeCategory);
  if (!next) return null;
  const vis = STATUS_VISUAL[next];
  return {
    nextStatus: next,
    label:      vis?.label   || next,
    emoji:      vis?.emoji   || "",
    color:      vis?.color   || "var(--brand)",
    bg:         vis?.bg      || "rgba(255,107,53,0.1)",
  };
}