export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Banner — matches StoreCard h-40 */}
      <div className="shimmer h-40 w-full" />

      <div className="p-4 space-y-4">
        {/* Store name row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="shimmer h-4 w-3/4 rounded-lg" />
            <div className="shimmer h-3 w-1/2 rounded-lg" />
          </div>
          <div className="shimmer h-8 w-8 rounded-full flex-shrink-0" />
        </div>

        {/* Metrics row — mirrors the tag chips */}
        <div className="flex gap-2 flex-wrap">
          <div className="shimmer h-6 w-20 rounded-full" />
          <div className="shimmer h-6 w-24 rounded-full" />
          <div className="shimmer h-6 w-16 rounded-full" />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-5 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Image — matches h-36 in ProductCard */}
      <div className="shimmer h-36 w-full" />

      <div className="p-3 space-y-3">
        <div className="shimmer h-4 w-2/3 rounded" />
        <div className="shimmer h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center mt-2">
          <div className="shimmer h-5 w-16 rounded" />
          <div className="shimmer h-11 w-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`shimmer h-3 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid var(--border)",
            borderTopColor: "var(--brand)",
            animation: "spin 1s linear infinite",
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-3 rounded-full"
          style={{
            border: "2px solid transparent",
            borderBottomColor: "#f59e0b",
            animation: "spin 0.65s linear infinite reverse",
          }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: "var(--brand)",
              animation: "pulseDot 1.2s infinite",
            }}
          />
        </div>
      </div>
      <div className="text-center">
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--text-secondary)" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.04))",
          border: "1px solid rgba(255,107,53,0.15)",
          animation: "float 4s ease-in-out infinite",
        }}
      >
        {icon || "🛒"}
      </div>
      <div>
        <h3
          className="text-lg font-bold mb-2"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm max-w-xs mx-auto leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          {subtitle}
        </p>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
