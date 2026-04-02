/**
 * DeleteAccountModal.jsx
 *
 * Confirms account deletion with password verification (local users)
 * or Google-only confirmation.
 *
 * Props:
 *   isOpen    {bool}
 *   onClose   {fn}
 *   onDeleted {fn}   called after successful deletion
 *   user      {obj}  current user object
 */
import { useState } from "react";
import { Eye, EyeOff, Trash2, X, AlertTriangle, Loader2, ShieldAlert } from "lucide-react";
import api from "../../api/api";

export default function DeleteAccountModal({ isOpen, onClose, onDeleted, user }) {
  const [password,     setPassword]     = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPw,       setShowPw]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");

  if (!isOpen) return null;

  const isGoogleOnly = user?.authProvider === "google" && !user?.password;
  const isValid      = confirmation === "DELETE" && (isGoogleOnly || password.length >= 1);

  const handleDelete = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      await api.delete("/auth/account", {
        data: { password, confirmation },
      });
      onDeleted();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setPassword("");
    setConfirmation("");
    setError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1.5px solid rgba(239,68,68,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-4"
          style={{ background: "rgba(239,68,68,0.06)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <ShieldAlert size={20} style={{ color: "#ef4444" }} />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Delete Account</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>This action is permanent and cannot be undone</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Warning box */}
          <div
            className="rounded-2xl p-4 space-y-2"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
              <p className="font-bold text-sm" style={{ color: "#ef4444" }}>What will be deleted:</p>
            </div>
            <ul className="text-xs space-y-1.5 pl-5" style={{ color: "var(--text-secondary)" }}>
              <li className="list-disc">Your profile, email and personal data</li>
              <li className="list-disc">All saved addresses and preferences</li>
              <li className="list-disc">Order history and ratings</li>
              {user?.role === "store" && (
                <li className="list-disc" style={{ color: "#f59e0b" }}>Your store will be closed (but store data is kept for order records)</li>
              )}
              <li className="list-disc">Active orders will be cancelled automatically</li>
            </ul>
          </div>

          {/* Password (local accounts) */}
          {!isGoogleOnly && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                Confirm your password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input-theme text-sm pr-11"
                  placeholder="Enter your current password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg opacity-50 hover:opacity-100"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation text */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "var(--text-muted)" }}>
              Type <span style={{ color: "#ef4444", fontFamily: "monospace" }}>DELETE</span> to confirm
            </label>
            <input
              type="text"
              className="input-theme text-sm font-mono"
              placeholder="DELETE"
              value={confirmation}
              onChange={e => { setConfirmation(e.target.value); setError(""); }}
              style={{
                borderColor: confirmation === "DELETE" ? "rgba(239,68,68,0.5)" : undefined,
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-xl p-3 text-sm flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleClose}
              disabled={loading}
              className="btn btn-ghost flex-1 justify-center py-3 text-sm"
            >
              Keep Account
            </button>
            <button
              onClick={handleDelete}
              disabled={!isValid || loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isValid ? "linear-gradient(135deg, #ef4444, #dc2626)" : "var(--elevated)",
                color:      isValid ? "white"                                      : "var(--text-muted)",
                boxShadow:  isValid ? "0 4px 16px rgba(239,68,68,0.35)" : "none",
              }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><Trash2 size={15} /> Delete Forever</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}