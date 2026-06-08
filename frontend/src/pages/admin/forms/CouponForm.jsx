import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { adminAPI } from "../../../api/api";

export function CouponForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: null,
    usageLimit: null,
    expiresAt: "",
    applicableCategories: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError("Coupon code is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminAPI.createCoupon({
        ...form,
        code: form.code.toUpperCase(),
        discountValue: Number(form.discountValue),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3
            className="font-bold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            New Platform Coupon
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{
              background: "var(--elevated)",
              color: "var(--text-muted)",
            }}
          >
            <X size={15} />
          </button>
        </div>
        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-3 max-h-[60vh] overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Code *
              </label>
              <input
                className="input-theme text-sm uppercase"
                required
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Type
              </label>
              <select
                className="input-theme text-sm"
                value={form.discountType}
                onChange={(e) => set("discountType", e.target.value)}
              >
                <option value="percent">Percent %</option>
                <option value="flat">Flat ₹</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Description
            </label>
            <input
              className="input-theme text-sm"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description for customers"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Value
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="0"
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Min ₹
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="0"
                value={form.minOrderAmount}
                onChange={(e) => set("minOrderAmount", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Max uses
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="1"
                placeholder="∞"
                value={form.usageLimit || ""}
                onChange={(e) => set("usageLimit", e.target.value || null)}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Expires
            </label>
            <input
              type="datetime-local"
              className="input-theme text-sm"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 justify-center py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-brand flex-1 justify-center py-2.5 text-sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Check size={14} /> Create
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
