/* ══════════════════════════════════════════════════════════════
   Skeleton.jsx — Production-quality loading & empty states
   ══════════════════════════════════════════════════════════════ */

/* ── Store Card Skeleton ── */
export function SkeletonCard() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Banner */}
      <div className="shimmer h-40 w-full" />

      <div className="p-3.5 space-y-3">
        {/* Name + chevron row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="shimmer h-4 w-3/5 rounded-md" />
            <div className="shimmer h-3 w-2/5 rounded-md" />
          </div>
          <div className="shimmer h-5 w-5 rounded-md flex-shrink-0" />
        </div>

        {/* Chips row */}
        <div className="flex gap-1.5">
          <div className="shimmer h-6 w-16 rounded-md" />
          <div className="shimmer h-6 w-24 rounded-md" />
          <div className="shimmer h-6 w-14 rounded-md" />
        </div>

        {/* Footer */}
        <div
          className="flex justify-between items-center pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="shimmer h-3.5 w-20 rounded-md" />
          <div className="shimmer h-6 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Product Card Skeleton ── */
export function SkeletonProductCard() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="shimmer h-36 w-full" />

      <div className="p-3 space-y-2.5">
        <div className="shimmer h-4 w-3/4 rounded-md" />
        <div className="shimmer h-3 w-1/2 rounded-md" />
        <div className="flex justify-between items-center mt-1">
          <div className="shimmer h-5 w-16 rounded-md" />
          <div className="shimmer h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ── Generic text skeleton ── */
export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`shimmer h-3.5 rounded-md ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

/* ── Page loader spinner ── */
export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative w-10 h-10">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2.5px solid var(--border)",
            borderTopColor: "var(--brand)",
            animation: "spin 0.7s linear infinite",
          }}
        />
      </div>
      <p
        className="text-[13px] font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        {message}
      </p>
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {/* Icon container */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
        style={{
          background: "var(--elevated)",
          border: "1px solid var(--border)",
        }}
      >
        {icon || "🛒"}
      </div>

      <div>
        <h3
          className="font-display font-bold text-[17px] mb-1.5"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm max-w-[260px] mx-auto leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {subtitle}
        </p>
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
