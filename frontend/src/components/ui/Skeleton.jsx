export function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-theme" style={{ backgroundColor: "var(--card)" }}>
      <div className="shimmer h-44 w-full" />
      <div className="p-4 space-y-3">
        <div className="shimmer h-4 w-3/4 rounded-lg" />
        <div className="shimmer h-3 w-1/2 rounded-lg" />
        <div className="flex gap-2 mt-2">
          <div className="shimmer h-6 w-16 rounded-full" />
          <div className="shimmer h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-theme p-4 space-y-3" style={{ backgroundColor: "var(--card)" }}>
      <div className="shimmer h-32 w-full rounded-xl" />
      <div className="shimmer h-4 w-2/3 rounded" />
      <div className="shimmer h-3 w-1/2 rounded" />
      <div className="flex justify-between items-center mt-2">
        <div className="shimmer h-5 w-16 rounded" />
        <div className="shimmer h-9 w-9 rounded-xl" />
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
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-brand/20 border-t-brand animate-spin" />
        <div className="absolute inset-1 w-10 h-10 rounded-full border-2 border-transparent border-b-orange-400/60 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.6s" }} />
      </div>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="text-5xl mb-2" style={{ animation: "float 3s ease-in-out infinite" }}>{icon || "🛒"}</div>
      <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
      <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</p>
      {action}
    </div>
  );
}