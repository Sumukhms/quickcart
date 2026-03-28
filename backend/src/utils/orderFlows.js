/**
 * orderFlows.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for category-based order lifecycle.
 *
 * Import this on the BACKEND (Node/ESM) and duplicate the
 * FLOW_CONFIG + helpers in the frontend utility if you don't
 * want a shared package. Both copies must stay in sync.
 *
 * Store categories → flow type:
 *   Food                 → "food"
 *   Groceries            → "grocery"
 *   Snacks | Beverages | Medicines | Other → "grocery"
 *   (non-food physical items don't have a "preparing" stage)
 */

// ─── Flow type resolution ──────────────────────────────────────
export const FOOD_CATEGORIES = ["Food"];

export function getFlowType(storeCategory) {
  return FOOD_CATEGORIES.includes(storeCategory) ? "food" : "grocery";
}

// ─── Ordered status sequences per flow ────────────────────────
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

// ─── All statuses that mean "available for delivery partner" ──
export const DELIVERY_TRIGGER_STATUSES = ["ready_for_pickup", "packing"];

/**
 * Get the next valid status in the flow for a given current status.
 * Returns null if already at the terminal state.
 *
 * @param {string} currentStatus
 * @param {string} storeCategory
 * @returns {string|null}
 */
export function getNextStatus(currentStatus, storeCategory) {
  const flow = getFlowType(storeCategory);
  const seq = FLOW_SEQUENCES[flow];
  const idx = seq.indexOf(currentStatus);
  if (idx === -1 || idx === seq.length - 1) return null;
  return seq[idx + 1];
}

/**
 * Check whether a transition is valid for the given store category.
 *
 * @param {string} fromStatus
 * @param {string} toStatus
 * @param {string} storeCategory
 * @returns {boolean}
 */
export function isValidTransition(fromStatus, toStatus, storeCategory) {
  // "cancelled" is always allowed from any non-terminal state
  if (toStatus === "cancelled") {
    return !["delivered", "cancelled"].includes(fromStatus);
  }
  return getNextStatus(fromStatus, storeCategory) === toStatus;
}

/**
 * Return all valid statuses for a given flow (used for model enum).
 * Merged set of both flows + "cancelled".
 */
export const ALL_VALID_STATUSES = [
  "pending",
  "confirmed",
  "preparing",    // food only
  "packing",      // grocery only
  "ready_for_pickup", // food only
  "out_for_delivery",
  "delivered",
  "cancelled",
];