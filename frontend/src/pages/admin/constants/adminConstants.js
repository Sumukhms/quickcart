// ── Admin Panel Constants ──────────────────────────────────────

export const TABS = [
  { id: "overview", label: "Overview", icon: "TrendingUp" },
  { id: "users", label: "Users", icon: "Users" },
  { id: "orders", label: "Orders", icon: "Package" },
  { id: "coupons", label: "Coupons", icon: "Tag" },
  { id: "banners", label: "Banners", icon: "Image" },
  { id: "payouts", label: "Payouts", icon: "Wallet" },
  { id: "refunds", label: "Refunds", icon: "CreditCard" },
];

export const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  preparing: "#8b5cf6",
  packing: "#06b6d4",
  ready_for_pickup: "#f97316",
  out_for_delivery: "#ff6b35",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

export const ROLE_COLORS = {
  customer: "#22c55e",
  store: "#3b82f6",
  delivery: "#f59e0b",
  admin: "#8b5cf6",
};

export const REFUND_STATUS_COLORS = {
  pending: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Pending" },
  manual_pending: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    label: "Manual Review",
  },
  refunded: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    label: "Refunded ✓",
  },
  failed: {
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    label: "Failed / Rejected",
  },
};

export const BG_PRESETS = [
  { label: "Orange–Red", value: "from-orange-600 via-red-600 to-pink-700" },
  {
    label: "Purple–Violet",
    value: "from-purple-700 via-violet-600 to-indigo-700",
  },
  { label: "Teal–Green", value: "from-teal-600 via-emerald-600 to-green-700" },
  { label: "Blue–Cyan", value: "from-blue-600 via-cyan-500 to-sky-600" },
  { label: "Rose–Pink", value: "from-rose-600 via-pink-600 to-fuchsia-700" },
  { label: "Amber–Orange", value: "from-amber-500 via-orange-500 to-red-600" },
];
