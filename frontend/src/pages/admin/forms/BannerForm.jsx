import { useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { adminAPI } from "../../../api/api";
import { BG_PRESETS } from "../constants/adminConstants";

export function BannerForm({ banner, onSave, onClose }) {
  const isEdit = !!banner;
  const [form, setForm] = useState({
    title: banner?.title || "",
    sub: banner?.sub || "",
    badge: banner?.badge || "",
    emoji: banner?.emoji || "🎁",
    cta: banner?.cta || "Order Now",
    bg: banner?.bg || BG_PRESETS[0].value,
    link: banner?.link || "/user/home",
    order: banner?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        await adminAPI.updateBanner(banner._id, form);
      } else {
        await adminAPI.createBanner(form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "var(--elevated)" }}
            >
              {form.emoji}
            </div>
            <h3
              className="font-bold text-lg"
              style={{ color: "var(--text-primary)" }}
            >
              {isEdit ? "Edit Banner" : "New Banner"}
            </h3>
          </div>
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

        {/* Live Preview */}
        <div
          className={`rounded-2xl p-5 mb-5 bg-gradient-to-br ${form.bg} relative overflow-hidden`}
        >
          <div className="relative z-10">
            {form.badge && (
              <span
                className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-2 text-white/90"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {form.badge}
              </span>
            )}
            <h3 className="font-bold text-xl text-white mb-1">
              {form.title || "Banner Title"}
            </h3>
            <p className="text-white/75 text-sm mb-3">
              {form.sub || "Sub-heading text"}
            </p>
            <span
              className="inline-block text-xs font-bold px-4 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.9)", color: "#1a1a22" }}
            >
              {form.cta}
            </span>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-80">
            {form.emoji}
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl p-3 mb-4 text-sm"
            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-[1fr,80px] gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Title *
              </label>
              <input
                className="input-theme text-sm"
                required
                placeholder="First Order FREE"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Emoji
              </label>
              <input
                className="input-theme text-sm text-center"
                placeholder="🎁"
                value={form.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                maxLength={4}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-1 block"
              style={{ color: "var(--text-muted)" }}
            >
              Sub-heading
            </label>
            <input
              className="input-theme text-sm"
              placeholder="Use code QUICKFIRST at checkout"
              value={form.sub}
              onChange={(e) => set("sub", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Badge chip
              </label>
              <input
                className="input-theme text-sm"
                placeholder="🎁 New user offer"
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                CTA Button
              </label>
              <input
                className="input-theme text-sm"
                placeholder="Order Now"
                value={form.cta}
                onChange={(e) => set("cta", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Link URL
              </label>
              <input
                className="input-theme text-sm"
                placeholder="/user/home"
                value={form.link}
                onChange={(e) => set("link", e.target.value)}
              />
            </div>
            <div>
              <label
                className="text-xs font-bold uppercase tracking-wider mb-1 block"
                style={{ color: "var(--text-muted)" }}
              >
                Display Order
              </label>
              <input
                type="number"
                className="input-theme text-sm"
                min="0"
                value={form.order}
                onChange={(e) => set("order", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label
              className="text-xs font-bold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-muted)" }}
            >
              Background Gradient
            </label>
            <div className="grid grid-cols-3 gap-2">
              {BG_PRESETS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("bg", value)}
                  className={`h-10 rounded-xl bg-gradient-to-br ${value} relative transition-all`}
                  style={{
                    border:
                      form.bg === value
                        ? "2px solid var(--brand)"
                        : "2px solid transparent",
                  }}
                >
                  {form.bg === value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={14} style={{ color: "white" }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
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
                  <Check size={14} />{" "}
                  {isEdit ? "Save Changes" : "Create Banner"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
