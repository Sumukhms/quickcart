/**
 * AddressManager.jsx
 *
 * Full address management widget used on:
 *   - CheckoutPage    (pick the delivery address)
 *   - UserProfile     (manage saved addresses)
 *
 * Loads saved structured addresses from /api/addresses.
 * Allows adding, editing, deleting, and setting a default.
 *
 * Props:
 *   selected      {string|null}  – _id of the selected address (for checkout)
 *   onSelect      {fn}           – called with the selected Address document
 *   showActions   {boolean}      – show edit/delete/default buttons (profile mode)
 *   compact       {boolean}      – hide "Add" button (use only in checkout)
 */
import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Plus, Edit3, Trash2, Check, Star, Home, Briefcase, Map, Loader2,
} from "lucide-react";
import { addressAPI, formatAddress } from "../../api/addressAPI.js";
import AddressForm from "./AddressForm.jsx";

const LABEL_ICONS = { Home, Work: Briefcase, Other: Map };
const LABEL_COLORS = { Home: "#22c55e", Work: "#3b82f6", Other: "#8b5cf6" };

function AddressCard({ addr, selected, onSelect, onEdit, onDelete, onSetDefault, showActions }) {
  const Icon  = LABEL_ICONS[addr.label] || MapPin;
  const color = LABEL_COLORS[addr.label] || "var(--brand)";
  const isSelected = selected === addr._id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(addr)}
      onKeyDown={(e) => e.key === "Enter" && onSelect && onSelect(addr)}
      className="relative group cursor-pointer w-full text-left transition-all hover:scale-[1.01]"
      style={{
        background:    isSelected ? "rgba(255,107,53,0.05)" : "var(--elevated)",
        border:        `1.5px solid ${isSelected ? "var(--brand)" : "var(--border)"}`,
        borderRadius:  "16px",
        padding:       "14px 16px",
        boxShadow:     isSelected ? "0 0 0 1px rgba(255,107,53,0.15)" : "none",
      }}
    >
      <div className="flex items-start gap-3">
        {/* Label icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: color + "15" }}
        >
          <Icon size={15} style={{ color }} />
        </div>

        {/* Address text */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold" style={{ color }}>
              {addr.label}
            </span>
            {addr.isDefault && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
              >
                DEFAULT
              </span>
            )}
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {addr.street}
          </p>
          {addr.area && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {addr.area}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
          </p>
          {addr.landmark && (
            <p className="text-xs mt-0.5 italic" style={{ color: "var(--text-muted)" }}>
              Near: {addr.landmark}
            </p>
          )}
        </div>

        {/* Selected tick */}
        {isSelected && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--brand)" }}
          >
            <Check size={11} style={{ color: "white" }} />
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex items-center gap-1.5 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}>
          {!addr.isDefault && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSetDefault(addr._id); }}
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:scale-105"
              style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
            >
              <Star size={10} /> Set default
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(addr); }}
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:scale-105"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
          >
            <Edit3 size={10} /> Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(addr._id); }}
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:scale-105"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
          >
            <Trash2 size={10} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function AddressManager({
  selected,
  onSelect,
  showActions = false,
  compact     = false,
}) {
  const [addresses, setAddresses]     = useState([]);
  const [loading,   setLoading]       = useState(true);
  const [showForm,  setShowForm]      = useState(false);
  const [editAddr,  setEditAddr]      = useState(null);
  const [error,     setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await addressAPI.list();
      setAddresses(data);
      // Auto-select default on first load (for checkout)
      if (onSelect && data.length > 0) {
        const def = data.find((a) => a.isDefault) || data[0];
        if (!selected) onSelect(def);
      }
    } catch {
      setError("Failed to load addresses. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const handleSave = (saved) => {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a._id === saved._id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditAddr(null);
    // Auto-select newly added address in checkout
    if (onSelect) onSelect(saved);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await addressAPI.remove(id);
      setAddresses((prev) => {
        const next = prev.filter((a) => a._id !== id);
        // If deleted was selected, pick default
        if (onSelect && selected === id && next.length > 0) {
          const def = next.find((a) => a.isDefault) || next[0];
          onSelect(def);
        }
        return next;
      });
    } catch {
      setError("Failed to delete address.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const { data } = await addressAPI.setDefault(id);
      setAddresses(data); // backend returns full updated list
    } catch {
      setError("Failed to set default address.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--brand)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {error && (
        <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
      )}

      {addresses.length === 0 && !showForm && (
        <div
          className="text-center py-6 rounded-2xl"
          style={{ background: "var(--elevated)", border: "1.5px dashed var(--border)" }}
        >
          <MapPin size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            No saved addresses
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Add your first delivery address below
          </p>
        </div>
      )}

      {addresses.map((addr) => (
        <AddressCard
          key={addr._id}
          addr={addr}
          selected={selected}
          onSelect={onSelect}
          onEdit={(a) => { setEditAddr(a); setShowForm(true); }}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
          showActions={showActions}
        />
      ))}

      {/* Add new button */}
      {!compact && addresses.length < 5 && !showForm && (
        <button
          type="button"
          onClick={() => { setEditAddr(null); setShowForm(true); }}
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

      {addresses.length >= 5 && (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Maximum 5 addresses saved. Delete one to add another.
        </p>
      )}

      {/* Address form modal */}
      {showForm && (
        <AddressForm
          address={editAddr}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditAddr(null); }}
        />
      )}
    </div>
  );
}