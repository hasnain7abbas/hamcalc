/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0a1a",
          900: "#13112a",
          850: "#181638",
          800: "#1e1b4b",
          700: "#2a2660",
          600: "#3b3577",
        },
        brand: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
        },
        accent: {
          cyan: "#a5f3fc",
          gold: "#fde68a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
        serif: ["Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(167,139,250,0.25), 0 8px 32px -8px rgba(124,58,237,0.45)",
      },
    },
  },
  plugins: [],
};
