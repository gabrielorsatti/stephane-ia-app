/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#ede3d3",
          soft: "#e3d8c4",
          card: "#f6efe2",
          elev: "#e8dcc7",
        },
        border: { DEFAULT: "#cfc1a6", strong: "#b6a687" },
        accent: {
          DEFAULT: "#8ab8a0",
          soft: "#4f8570",
          muted: "#c7ddce",
        },
        text: {
          DEFAULT: "#3d332e",
          muted: "#66584f",
          dim: "#8c7d71",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
