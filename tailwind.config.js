/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#faf6f1",
          soft: "#f2ece3",
          card: "#ffffff",
          elev: "#f7f2ea",
        },
        border: { DEFAULT: "#e7ded0", strong: "#d2c6b2" },
        accent: {
          DEFAULT: "#a7c7b5",
          soft: "#6a9e84",
          muted: "#e4efe5",
        },
        text: {
          DEFAULT: "#4a3f3a",
          muted: "#7a6e66",
          dim: "#a89d93",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
