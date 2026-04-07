/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ff6b35",
          light:   "#ff8c5a",
          dark:    "#e5521e",
          50:  "#fff4ef",
          100: "#ffe4d4",
          200: "#ffc8a8",
          500: "#ff6b35",
          600: "#e5521e",
          700: "#c44113",
        },
        // Semantic aliases that map to CSS vars (for Tailwind utilities)
        success: { DEFAULT: "#16a34a", dark: "#22c55e" },
        warning: { DEFAULT: "#d97706", dark: "#f59e0b" },
        error:   { DEFAULT: "#dc2626", dark: "#ef4444" },
        info:    { DEFAULT: "#2563eb", dark: "#3b82f6" },
      },
      fontFamily: {
        sans:    ["'DM Sans'",   "sans-serif"],
        display: ["'Fraunces'",  "serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        // Matches CSS custom property shadows exactly
        "xs":   "0 1px 2px rgba(0,0,0,0.05)",
        "card": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 10px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
        "float": "0 20px 48px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.06)",
        "brand": "0 4px 12px rgba(229,82,30,0.28)",
        "glow":  "0 0 0 3px rgba(255,107,53,0.15)",
      },
      animation: {
        "slide-up":    "slideUp 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "slide-down":  "slideDown 0.45s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":     "fadeIn 0.25s ease both",
        "scale-in":    "scaleIn 0.25s cubic-bezier(0.16,1,0.3,1) both",
        "shimmer":     "shimmer 1.8s ease-in-out infinite",
        "float":       "float 3s ease-in-out infinite",
        "float-slow":  "floatSlow 5s ease-in-out infinite",
        "pulse-dot":   "pulseDot 1.5s infinite",
        "spin-slow":   "spin 3s linear infinite",
        "toast-in":    "toastIn 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "badge-bounce":"badgeBounce 0.5s ease",
        "breathe":     "breathe 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};