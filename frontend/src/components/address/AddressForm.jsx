/**
 * AddressForm.jsx
 *
 * Modal form for creating or editing a structured address.
 * Features:
 *   - GPS auto-fill button (calls Nominatim via backend)
 *   - Field-level validation
 *   - Label selector (Home / Work / Other)
 *   - Loading + error states
 *
 * Props:
 *   address   {object|null}  – existing address to edit, or null for new
 *   onSave    {fn}           – called with the saved Address document
 *   onClose   {fn}           – close the modal
 */
import { useState } from "react";
import {
  MapPin, Navigation, X, Check, Loader2, Home, Briefcase, Map,
  AlertCircle,
} from "lucide-react";
import { addressAPI, requestGPS } from "../../api/addressAPI.js";

const LABELS = [
  { id: "Home",  icon: Home,      color: "#22c55e" },
  { id: "Work",  icon: Briefcase, color: "#3b82f6" },
  { id: "Other", icon: Map,       color: "#8b5cf6" },
];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu",
  "Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const EMPTY_FORM = {
  label:    "Home",
  street:   "",
  area:     "",
  city:     "",
  state:    "Karnataka",
  pincode:  "",
  landmark: "",
};

function Field({ label, required, error, children }) {
  return (
    <div>
      <label
        className="block text-xs font-bold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#ef4444" }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

export default function AddressForm({ address, onSave, onClose }) {
  const isEdit = !!address;

  const [form, setForm] = useState(
    address
      ? {
          label:    address.label    || "Home",
          street:   address.street   || "",
          area:     address.area     || "",
          city:     address.city     || "",
          state:    address.state    || "Karnataka",
          pincode:  address.pincode  || "",
          landmark: address.landmark || "",
          lat:      address.lat,
          lng:      address.lng,
        }
      : { ...EMPTY_FORM }
  );

  const [errors,      setErrors]      = useState({});
  const [saving,      setSaving]      = useState(false);
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsError,    setGpsError]    = useState("");
  const [saveError,   setSaveError]   = useState("");

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  // ── GPS auto-fill ─────────────────────────────────────────
  const handleGPS = async () => {
    setGpsLoading(true);
    setGpsError("");
    try {
      const { lat, lng } = await requestGPS();
      const { data } = await addressAPI.fromCoords(lat, lng);
      setForm((f) => ({
        ...f,
        street:   data.street   || f.street,
        area:     data.area     || f.area,
        city:     data.city     || f.city,
        state:    data.state    || f.state,
        pincode:  data.pincode  || f.pincode,
        landmark: data.landmark || f.landmark,
        lat:      data.lat,
        lng:      data.lng,
      }));
      setErrors({});
    } catch (err) {
      setGpsError(typeof err === "string" ? err : "Could not detect location.");
    } finally {
      setGpsLoading(false);
    }
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.street.trim())  e.street  = "Street / building is required";
    if (!form.city.trim())    e.city    = "City is required";
    if (!form.state.trim())   e.state   = "State is required";
    if (!/^\d{6}$/.test(form.pincode.trim()))
      e.pincode = "Pincode must be exactly 6 digits";
    return e;
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    setSaveError("");
    try {
      let saved;
      if (isEdit) {
        const { data } = await addressAPI.update(address._id, form);
        saved = data;
      } else {
        const { data } = await addressAPI.add(form);
        saved = data;
      }
      onSave(saved);
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.1)" }}
            >
              <MapPin size={16} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
                {isEdit ? "Edit Address" : "Add New Address"}
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Up to 5 saved addresses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:scale-110"
            style={{ background: "var(--elevated)", color: "var(--text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 space-y-4 overflow-y-auto"
          style={{ maxHeight: "75vh" }}
        >
          {/* Label selector */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Address Label
            </label>
            <div className="flex gap-2">
              {LABELS.map(({ id, icon: Icon, color }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => set("label", id)}
                  className="flex items-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-bold justify-center transition-all hover:scale-105"
                  style={{
                    background: form.label === id ? color + "15" : "var(--elevated)",
                    color:      form.label === id ? color         : "var(--text-muted)",
                    border: `1.5px solid ${form.label === id ? color + "50" : "var(--border)"}`,
                  }}
                >
                  <Icon size={13} />
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* GPS auto-fill */}
          <button
            type="button"
            onClick={handleGPS}
            disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
            style={{
              background: "rgba(59,130,246,0.08)",
              color:      "#3b82f6",
              border:     "1.5px solid rgba(59,130,246,0.2)",
            }}
          >
            {gpsLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Navigation size={15} />
            )}
            {gpsLoading ? "Detecting location…" : "📍 Use My Current Location"}
          </button>

          {gpsError && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-xs"
              style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              {gpsError}
            </div>
          )}

          {/* Street */}
          <Field label="Flat / Building / Street" required error={errors.street}>
            <input
              className="input-theme text-sm"
              placeholder="e.g. 42, Park Residency, MG Road"
              value={form.street}
              onChange={(e) => set("street", e.target.value)}
            />
          </Field>

          {/* Area */}
          <Field label="Area / Locality">
            <input
              className="input-theme text-sm"
              placeholder="e.g. Indiranagar, Koramangala"
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
            />
          </Field>

          {/* City + Pincode */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" required error={errors.city}>
              <input
                className="input-theme text-sm"
                placeholder="Bengaluru"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </Field>
            <Field label="Pincode" required error={errors.pincode}>
              <input
                className="input-theme text-sm"
                placeholder="560001"
                maxLength={6}
                inputMode="numeric"
                value={form.pincode}
                onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          {/* State */}
          <Field label="State" required error={errors.state}>
            <select
              className="input-theme text-sm"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
            >
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          {/* Landmark */}
          <Field label="Landmark (optional)">
            <input
              className="input-theme text-sm"
              placeholder="e.g. Near HDFC Bank, Opposite Forum Mall"
              value={form.landmark}
              onChange={(e) => set("landmark", e.target.value)}
            />
          </Field>

          {saveError && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={14} /> {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 justify-center py-3 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-brand flex-1 justify-center py-3 text-sm"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <><Check size={14} /> {isEdit ? "Update" : "Save Address"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}