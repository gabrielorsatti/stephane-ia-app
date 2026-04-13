/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0f1316",
          soft: "#161b1f",
          card: "#1a1f24",
          elev: "#222931",
        },
        border: { DEFAULT: "#2a3138", strong: "#3a434d" },
        // Accent principal : menthe douce. Les accents secondaires (bleu
        // poudré, lavande) sont exposés comme palettes dédiées pour les
        // graphiques multi-séries.
        accent: {
          DEFAULT: "#a7e8c9",
          soft: "#7dd3ae",
          muted: "#22372f",
        },
        powder: {
          DEFAULT: "#a8d0e6",
          soft: "#7fb5d4",
          muted: "#1f3340",
        },
        lavender: {
          DEFAULT: "#c9b8e8",
          soft: "#a892d1",
          muted: "#2e2940",
        },
        text: {
          DEFAULT: "#eef1f4",
          muted: "#a8b2bc",
          dim: "#6f7881",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
