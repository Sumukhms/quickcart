import { Check, X } from "lucide-react";

export default function BulkEditBanner({ pendingCount, onCancel, onSave }) {
  return (
    <div
      className="rounded-2xl p-4 mb-5 flex items-center justify-between gap-3"
      style={{
        background: "rgba(255,107,53,0.08)",
        border: "1.5px solid rgba(255,107,53,0.25)",
      }}
    >
      <div>
        <p className="font-bold text-sm" style={{ color: "var(--brand)" }}>
          Bulk Edit Mode
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Edit stock values below, then click Save All.
          {pendingCount > 0 && ` ${pendingCount} changes pending.`}
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onCancel} className="btn btn-ghost text-xs py-2 px-3">
          <X size={13} /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!pendingCount}
          className="btn btn-brand text-xs py-2 px-3"
        >
          <Check size={13} /> Save All ({pendingCount})
        </button>
      </div>
    </div>
  );
}
