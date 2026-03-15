/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#6366f1",       // main indigo
        brandLight: "#818cf8",  // hover / highlights
        brandGlow: "#a5b4fc",   // glow accents

        bgMain: "#020617",      // deep dark background
        bgSoft: "#0f172a",      // section background
        card: "#1e293b",        // card surfaces

        textPrimary: "#f8fafc",
        textMuted: "#94a3b8"
      }
    },
  },
  plugins: [],
}