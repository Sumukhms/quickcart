export default function InventoryStatCard({ label, value, color, icon: Icon }) {
  return (
    <div
      className="rounded-2xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
        style={{ background: color + "15" }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <p
        className="font-display font-black text-2xl"
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
    </div>
  );
}
