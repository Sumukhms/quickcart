/**
 * RevenueChart.jsx
 *
 * Renders the revenueByDay data already returned by /api/stores/analytics.
 * Drop inside StoreDashboard after the <StoreAnalytics> component.
 *
 * Props:
 *   data  {Array}  revenueByDay from analytics API:
 *                  [{ _id: "2025-04-01", revenue: 1200, orders: 5 }, …]
 */
import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Minus } from "lucide-react";

function fmt(n) {
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  return `₹${n}`;
}

function shortDay(dateStr) {
  // dateStr: "2025-04-01"
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
}

export default function RevenueChart({ data = [] }) {
  const [hovered, setHovered] = useState(null);

  if (!data.length) {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <BarChart3 size={28} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No revenue data for the last 7 days yet
        </p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders  = data.reduce((s, d) => s + d.orders,  0);

  // Week-over-week trend: compare first half vs second half
  const mid    = Math.floor(data.length / 2);
  const first  = data.slice(0, mid).reduce((s, d) => s + d.revenue, 0);
  const second = data.slice(mid).reduce((s, d) => s + d.revenue, 0);
  const trend  = first === 0 ? 0 : ((second - first) / first) * 100;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "#22c55e" : trend < 0 ? "#ef4444" : "var(--text-muted)";

  return (
    <div
      className="rounded-2xl overflow-hidden mb-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Revenue — Last 7 Days
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-display font-black text-2xl" style={{ color: "var(--text-primary)" }}>
              {fmt(totalRevenue)}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {totalOrders} orders
            </span>
            {trend !== 0 && (
              <span
                className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg"
                style={{ background: trendColor + "15", color: trendColor }}
              >
                <TrendIcon size={11} />
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <BarChart3 size={18} style={{ color: "var(--text-muted)" }} />
      </div>

      {/* Chart */}
      <div className="px-5 pt-5 pb-3">
        {/* Tooltip */}
        <div
          className="text-xs font-semibold mb-3 h-5 transition-all"
          style={{ color: "var(--brand)", minHeight: 20 }}
        >
          {hovered != null && data[hovered]
            ? `${shortDay(data[hovered]._id)} — ${fmt(data[hovered].revenue)} · ${data[hovered].orders} order${data[hovered].orders !== 1 ? "s" : ""}`
            : ""}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {data.map((d, i) => {
            const pct      = maxRevenue === 0 ? 0 : (d.revenue / maxRevenue) * 100;
            const isHov    = hovered === i;
            const barColor = isHov ? "var(--brand)" : "rgba(255,107,53,0.35)";

            return (
              <div
                key={d._id}
                className="flex-1 flex flex-col items-center gap-1 cursor-pointer group"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="w-full flex items-end" style={{ height: 100 }}>
                  <div
                    className="w-full rounded-t-lg transition-all duration-300"
                    style={{
                      height:     `${Math.max(pct, 4)}%`,
                      background: barColor,
                      boxShadow:  isHov ? `0 -4px 16px rgba(255,107,53,0.4)` : "none",
                    }}
                  />
                </div>
                <span
                  className="text-[9px] font-semibold text-center"
                  style={{ color: isHov ? "var(--brand)" : "var(--text-muted)" }}
                >
                  {shortDay(d._id).split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer stats */}
      <div
        className="grid grid-cols-3 divide-x px-0"
        style={{ borderTop: "1px solid var(--border)", borderColor: "var(--border)" }}
      >
        {[
          {
            label: "Best Day",
            value: fmt(Math.max(...data.map((d) => d.revenue))),
            sub:   shortDay(data.reduce((a, b) => (a.revenue > b.revenue ? a : b))._id),
          },
          {
            label: "Avg / Day",
            value: fmt(Math.round(totalRevenue / data.length)),
            sub:   `${Math.round(totalOrders / data.length)} orders`,
          },
          {
            label: "Trend",
            value: trend === 0 ? "Flat" : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`,
            sub:   "vs prior days",
            color: trendColor,
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="flex flex-col items-center py-3 px-2 gap-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="text-sm font-bold" style={{ color: color || "var(--text-primary)" }}>
              {value}
            </p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}