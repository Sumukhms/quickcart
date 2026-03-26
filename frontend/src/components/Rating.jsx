export function StarRating({ rating = 0, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L7.5 4.5H11L8.5 6.8L9.5 10.5L6 8.5L2.5 10.5L3.5 6.8L1 4.5H4.5L6 1Z"
            fill={i <= Math.round(rating) ? "#f59e0b" : "var(--border)"}
          />
        </svg>
      ))}
    </div>
  );
}

export function RatingBadge({ rating }) {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg" 
      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
      ⭐ {rating?.toFixed(1) || "4.5"}
    </span>
  );
}