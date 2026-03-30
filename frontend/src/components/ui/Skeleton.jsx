export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="shimmer h-40 w-full" />
      <div className="p-4 space-y-3">
        <div className="shimmer h-4 w-3/4 rounded-lg" />
        <div className="shimmer h-3 w-1/2 rounded-lg" />
        <div className="flex gap-2 mt-2">
          <div className="shimmer h-6 w-16 rounded-full" />
          <div className="shimmer h-6 w-20 rounded-full" />
        </div>
        <div className="shimmer h-px w-full" style={{ marginTop: "0.75rem" }} />
        <div className="flex justify-between">
          <div className="shimmer h-4 w-24 rounded" />
          <div className="shimmer h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="shimmer h-32 w-full" />
      <div className="p-3 space-y-2">
        <div className="shimmer h-4 w-2/3 rounded" />
        <div className="shimmer h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center mt-2">
          <div className="shimmer h-5 w-14 rounded" />
          <div className="shimmer h-8 w-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`shimmer h-3 rounded ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function PageLoader() {
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
        <div
          className="absolute inset-0 flex items-center justify-center"
        >
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
        <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Loading...</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Just a moment</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div
        className="text-6xl mb-2 select-none"
        style={{ animation: "floatSlow 4s ease-in-out infinite" }}
      >
        {icon || "🛒"}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p className="text-sm max-w-xs mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}