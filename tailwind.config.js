/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0b",
          soft: "#111113",
          card: "#17171a",
          elev: "#1e1e22",
        },
        border: { DEFAULT: "#26262b", strong: "#35353d" },
        accent: {
          DEFAULT: "#f97316",
          soft: "#fb923c",
          muted: "#7c2d12",
        },
        text: {
          DEFAULT: "#f4f4f5",
          muted: "#a1a1aa",
          dim: "#71717a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
