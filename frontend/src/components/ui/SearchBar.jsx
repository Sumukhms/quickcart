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

  const isLg = size === "lg";
  const iconSize = isLg ? 17 : size === "sm" ? 13 : 15;

  return (
    <div className={`relative ${className}`}>
      <Search
        size={iconSize}
        className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
        style={{
          left: isLg ? "1rem" : "0.875rem",
          color: "var(--text-muted)",
        }}
      />
      <input
        ref={inputRef}
        type="text"
        className="input-theme w-full"
        style={{
          paddingLeft:  isLg ? "2.75rem" : size === "sm" ? "2.125rem" : "2.5rem",
          paddingRight: value ? (isLg ? "2.75rem" : "2.25rem") : "1rem",
          paddingTop:    isLg ? "0.875rem" : undefined,
          paddingBottom: isLg ? "0.875rem" : undefined,
          fontSize: isLg ? "1rem" : size === "sm" ? "0.8125rem" : undefined,
          borderRadius: isLg ? "12px" : undefined,
        }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 -translate-y-1/2 p-1 rounded-md transition-all hover:bg-[var(--elevated)] active:scale-95"
          style={{
            right: "0.625rem",
            color: "var(--text-muted)",
          }}
          aria-label="Clear search"
        >
          <X size={iconSize - 1} />
        </button>
      )}
    </div>
  );
}