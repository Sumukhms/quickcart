/**
 * AddressSelector — lets users pick from saved addresses or add a new one.
 *
 * Props:
 *   addresses      {string[]}  list of saved address strings
 *   selected       {string}    currently selected address
 *   onSelect       {fn}        called with selected address string
 *   onAdd          {fn}        called with new address string when saved
 *   onDelete       {fn}        called with index to delete (optional)
 *   maxAddresses   {number}    max addresses allowed (default 5)
 *
 * Used in:
 *   - CheckoutPage  (replaces inline address section)
 *   - UserProfile   (address management)
 */
import { useState } from "react";
import { MapPin, Plus, Trash2, Check, X, Edit3 } from "lucide-react";

const MAX_DEFAULT = 5;

function AddressChip({ address, selected, onSelect, onDelete, index }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(address)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(address)}
      className="w-full flex items-start gap-3 p-3.5 rounded-2xl text-left transition-all hover:scale-[1.01] group cursor-pointer"
      style={{
        background: selected ? "rgba(255,107,53,0.06)" : "var(--elevated)",
        border: `1.5px solid ${selected ? "var(--brand)" : "var(--border)"}`,
      }}
    >
      <MapPin
        size={14}
        style={{ color: selected ? "var(--brand)" : "var(--text-muted)", flexShrink: 0, marginTop: 2 }}
      />
      <div className="flex-1 min-w-0">
        {index === 0 && (
          <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>
            Default
          </p>
        )}
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {address}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {selected && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <Check size={11} style={{ color: "white" }} />
          </div>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(index); }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
            style={{ color: "#ef4444" }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
export default function AddressSelector({
  addresses = [],
  selected = "",
  onSelect,
  onAdd,
  onDelete,
  maxAddresses = MAX_DEFAULT,
}) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Please enter an address");
      return;
    }
    if (trimmed.length < 10) {
      setError("Address seems too short — add more details");
      return;
    }
    if (addresses.includes(trimmed)) {
      setError("This address is already saved");
      return;
    }
    onAdd(trimmed);
    setDraft("");
    setShowForm(false);
    setError("");
  };

  const handleCancel = () => {
    setDraft("");
    setError("");
    setShowForm(false);
  };

  return (
    <div className="space-y-2.5">
      {/* Existing addresses */}
      {addresses.map((addr, i) => (
        <AddressChip
          key={i}
          address={addr}
          index={i}
          selected={selected === addr}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}

      {/* Add new address */}
      {!showForm && addresses.length < maxAddresses && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-80"
          style={{ color: "var(--brand)" }}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,107,53,0.12)" }}
          >
            <Plus size={13} style={{ color: "var(--brand)" }} />
          </div>
          Add new address
        </button>
      )}

      {/* Inline add form */}
      {showForm && (
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--elevated)", border: "1.5px solid var(--brand)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            New Address
          </p>
          <textarea
            className="input-theme text-sm resize-none"
            rows={3}
            placeholder="Full address: building, street, area, city, PIN…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError("");
            }}
            autoFocus
          />
          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost flex-1 justify-center py-2 text-sm"
            >
              <X size={13} /> Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-brand flex-1 justify-center py-2 text-sm"
            >
              <Check size={13} /> Save Address
            </button>
          </div>
        </div>
      )}

      {addresses.length >= maxAddresses && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Maximum {maxAddresses} addresses saved. Delete one to add another.
        </p>
      )}
    </div>
  );
}