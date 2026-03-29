/**
 * FavoriteButton.jsx
 *
 * Reusable heart button for toggling store favorites.
 *
 * Props:
 *   storeId   {string}   the store's _id
 *   size      {number}   icon size (default 16)
 *   className {string}   extra wrapper classes
 *   variant   "icon" | "badge"   display mode (default "icon")
 *
 * Used in:
 *   - StoreCard
 *   - UserStorePage (hero section)
 *   - UserProfile (saved stores section)
 */
import { Heart } from "lucide-react";
import { useFavorites } from "../../context/FavoriteContext";
import { useAuth }      from "../../context/AuthContext";

export default function FavoriteButton({ storeId, size = 16, className = "", variant = "icon" }) {
  const { isCustomer } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Only customers can favorite stores
  if (!isCustomer) return null;

  const active = isFavorite(storeId);

  const handleClick = (e) => {
    e.preventDefault();   // don't follow Link wrapper
    e.stopPropagation();
    toggleFavorite(storeId);
  };

  if (variant === "badge") {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 ${className}`}
        style={{
          background: active ? "rgba(239,68,68,0.12)" : "var(--elevated)",
          color:      active ? "#ef4444"               : "var(--text-secondary)",
          border: `1px solid ${active ? "rgba(239,68,68,0.3)" : "var(--border)"}`,
        }}
        title={active ? "Remove from saved" : "Save store"}
      >
        <Heart size={13} fill={active ? "#ef4444" : "none"} stroke={active ? "#ef4444" : "currentColor"} />
        {active ? "Saved" : "Save"}
      </button>
    );
  }

  // Default: icon-only
  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${className}`}
      style={{
        background: active ? "rgba(239,68,68,0.12)" : "var(--elevated)",
        border:     `1px solid ${active ? "rgba(239,68,68,0.25)" : "var(--border)"}`,
      }}
      title={active ? "Remove from saved" : "Save store"}
    >
      <Heart
        size={size}
        fill={active ? "#ef4444" : "none"}
        stroke={active ? "#ef4444" : "var(--text-muted)"}
        style={{ transition: "all 0.2s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </button>
  );
}