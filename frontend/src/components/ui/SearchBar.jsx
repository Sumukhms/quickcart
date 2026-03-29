/**
 * SearchBar — reusable search input component
 *
 * Props:
 *   value        {string}   controlled value
 *   onChange     {fn}       called with new string value
 *   placeholder  {string}   input placeholder text
 *   className    {string}   extra CSS classes for wrapper
 *   onClear      {fn}       optional — called when X is clicked
 *   autoFocus    {bool}     auto-focus on mount
 *   size         {string}   "sm" | "md" (default "md")
 */
import { Search, X } from "lucide-react";
import { useRef } from "react";

export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search…",
  className = "",
  onClear,
  autoFocus = false,
  size = "md",
}) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  const padding = size === "sm" ? "py-2 pl-9 pr-8 text-xs" : "py-2.5 pl-10 pr-9 text-sm";
  const iconSize = size === "sm" ? 13 : 15;

  return (
    <div className={`relative ${className}`}>
      <Search
        size={iconSize}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        ref={inputRef}
        type="text"
        className={`input-theme ${padding} w-full`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-all hover:scale-110"
          style={{ color: "var(--text-muted)" }}
          aria-label="Clear search"
        >
          <X size={iconSize} />
        </button>
      )}
    </div>
  );
}