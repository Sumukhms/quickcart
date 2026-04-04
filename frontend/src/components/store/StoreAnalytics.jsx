/**
 * StoreAnalytics.jsx  (replaces the inline StoreAnalytics function in StoreDashboard)
 *
 * Now renders BOTH:
 *   1. RevenueChart  — revenueByDay bar chart (was fetched but never shown)
 *   2. Top Products  — horizontal bar list (unchanged)
 *
 * Usage in StoreDashboard:
 *   import StoreAnalytics from "../../components/store/StoreAnalytics";
 *   ...
 *   <StoreAnalytics storeId={store._id} />
 */
import { useState, useEffect } from "react";
import { adminAPI } from "../../api/api";
import RevenueChart from "./RevenueChart";

export default function StoreAnalytics({ storeId }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI
      .getAnalytics()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) return null;
  if (!data) return null;

  const maxSold = Math.max(...(data.topProducts || []).map((p) => p.totalSold), 1);

  return (
    <div className="space-y-0 mb-5">
      {/* ── Revenue bar chart (NEW) ── */}
      <RevenueChart data={data.revenueByDay || []} />

      {/* ── Top selling products ── */}
      {data.topProducts?.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Top Selling Products
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1">
                  <p
                    className="text-sm font-semibold truncate mr-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {i + 1}. {p.name}
                  </p>
                  <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    <span>{p.totalSold} sold</span>
                    <span className="font-semibold" style={{ color: "var(--brand)" }}>
                      ₹{p.revenue?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width:      `${(p.totalSold / maxSold) * 100}%`,
                      background: "var(--brand)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}