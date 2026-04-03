/**
 * ImageUploader.jsx
 *
 * Reusable drag-and-drop image upload component that integrates
 * directly with the Cloudinary backend via uploadAPI.
 *
 * Props:
 *   type          {"product"|"store"|"avatar"}  — which upload endpoint to use
 *   entityId      {string}  [optional]          — productId for type="product"
 *   currentImage  {string}  [optional]          — existing image URL for preview
 *   onUploaded    {fn}      ({url, publicId})   — called on successful upload
 *   onError       {fn}      (message)           — called on error
 *   label         {string}  [optional]          — custom label text
 *   compact       {boolean} [optional]          — small variant for inline use
 *   shape         {"rect"|"square"|"circle"}    — default "rect"
 *
 * Usage:
 *   <ImageUploader
 *     type="product"
 *     entityId={product._id}
 *     currentImage={product.image}
 *     onUploaded={({ url }) => setForm(f => ({ ...f, image: url }))}
 *   />
 */
import { useState, useRef, useCallback } from "react";
import { Upload, X, Check, ImagePlus, Loader2, AlertCircle } from "lucide-react";
import { uploadAPI, validateImageFile } from "../../api/uploadAPI.js";

const SHAPE_STYLES = {
  rect:   { borderRadius: "16px", aspectRatio: "16/9" },
  square: { borderRadius: "16px", aspectRatio: "1/1" },
  circle: { borderRadius: "9999px", aspectRatio: "1/1" },
};

export default function ImageUploader({
  type         = "product",
  entityId,
  currentImage = "",
  onUploaded,
  onError,
  label,
  compact = false,
  shape   = "rect",
}) {
  const [preview,    setPreview]    = useState(currentImage || "");
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    // Client-side validation
    const check = validateImageFile(file);
    if (!check.valid) {
      setError(check.message);
      if (onError) onError(check.message);
      return;
    }

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError("");
    setSuccess(false);
    setUploading(true);
    setProgress(0);

    try {
      let result;
      if (type === "product") {
        result = await uploadAPI.productImage(file, entityId, setProgress);
      } else if (type === "store") {
        result = await uploadAPI.storeLogo(file, setProgress);
      } else {
        result = await uploadAPI.avatar(file, setProgress);
      }

      // Replace blob URL with real Cloudinary URL
      URL.revokeObjectURL(objectUrl);
      setPreview(result.url);
      setProgress(100);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);

      if (onUploaded) onUploaded(result);
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      setPreview(currentImage || "");
      const msg = err.response?.data?.message || "Upload failed. Please try again.";
      setError(msg);
      if (onError) onError(msg);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [type, entityId, currentImage, onUploaded, onError]);

  // ── File input change ───────────────────────────────────────
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";           // reset so same file can be re-selected
  };

  // ── Drag & drop ─────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = ()  => setIsDragging(false);

  // ── Clear ───────────────────────────────────────────────────
  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(currentImage || "");
    setError("");
  };

  const shapeStyle = SHAPE_STYLES[shape] || SHAPE_STYLES.rect;
  const defaultLabel = type === "product" ? "Product Image"
                     : type === "store"   ? "Store Logo"
                     : "Profile Photo";
  const displayLabel = label || defaultLabel;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Tiny thumbnail */}
        <div
          className="flex-shrink-0 overflow-hidden"
          style={{ width: 52, height: 52, borderRadius: shape === "circle" ? "50%" : 12, background: "var(--elevated)", border: "1.5px solid var(--border)" }}
        >
          {preview
            ? <img src={preview} alt="preview" className="w-full h-full object-cover" onError={() => setPreview("")} />
            : <div className="w-full h-full flex items-center justify-center"><ImagePlus size={18} style={{ color: "var(--text-muted)" }} /></div>
          }
        </div>

        {/* Button + progress */}
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={() => !uploading && inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:scale-105 disabled:opacity-60"
            style={{ background: "var(--elevated)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            {uploading
              ? <><Loader2 size={12} className="animate-spin" /> Uploading {progress}%</>
              : success
              ? <><Check size={12} style={{ color: "#22c55e" }} /> Uploaded!</>
              : <><Upload size={12} /> Change {displayLabel}</>
            }
          </button>
          {error && (
            <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "#ef4444" }}>
              <AlertCircle size={10} /> {error}
            </p>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={handleInputChange} />
      </div>
    );
  }

  // ── Full-size variant ────────────────────────────────────────
  return (
    <div>
      {/* Label */}
      <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
        {displayLabel}
      </p>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative overflow-hidden cursor-pointer transition-all"
        style={{
          ...shapeStyle,
          width:       "100%",
          background:  isDragging ? "rgba(255,107,53,0.06)" : "var(--elevated)",
          border:      `2px dashed ${isDragging ? "var(--brand)" : error ? "#ef4444" : "var(--border)"}`,
          boxShadow:   isDragging ? "0 0 0 3px rgba(255,107,53,0.12)" : "none",
        }}
      >
        {/* Preview image */}
        {preview && !uploading ? (
          <div className="absolute inset-0">
            <img
              src={preview}
              alt="Upload preview"
              className="w-full h-full object-cover"
              onError={() => setPreview("")}
            />
            {/* Overlay on hover */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
            >
              <Upload size={22} style={{ color: "white" }} />
              <p className="text-white text-xs font-semibold">Click to change</p>
            </div>
            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
              title="Remove image"
            >
              <X size={13} />
            </button>
          </div>
        ) : uploading ? (
          /* Upload progress overlay */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: "var(--elevated)" }}>
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="var(--border)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke="var(--brand)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.2s ease" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                style={{ color: "var(--brand)" }}>
                {progress}%
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Uploading…</p>
          </div>
        ) : (
          /* Empty state */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: isDragging ? "rgba(255,107,53,0.12)" : "var(--card)" }}>
              <ImagePlus size={22} style={{ color: isDragging ? "var(--brand)" : "var(--text-muted)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: isDragging ? "var(--brand)" : "var(--text-secondary)" }}>
                {isDragging ? "Drop to upload" : "Click or drag & drop"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                JPEG, PNG, WebP · max 5 MB
              </p>
            </div>
          </div>
        )}

        {/* Success flash */}
        {success && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.15)", animation: "fadeIn 0.2s ease" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.2)" }}>
              <Check size={22} style={{ color: "#22c55e" }} />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs"
          style={{ color: "#ef4444" }}>
          <AlertCircle size={12} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}