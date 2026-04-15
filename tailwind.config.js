/** @type {import('tailwindcss').Config} */
// Les couleurs pointent vers des CSS variables définies dans src/index.css.
// Chaque variable contient un triplet RGB (ex: "15 19 22") pour supporter
// le modifier `/<alpha-value>` de Tailwind (bg-bg-card/50 etc.).
// Le thème actif est contrôlé par l'attribut data-theme sur <html>.
const rgb = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: rgb("--c-bg"),
          soft: rgb("--c-bg-soft"),
          card: rgb("--c-bg-card"),
          elev: rgb("--c-bg-elev"),
        },
        border: {
          DEFAULT: rgb("--c-border"),
          strong: rgb("--c-border-strong"),
        },
        accent: {
          DEFAULT: rgb("--c-accent"),
          soft: rgb("--c-accent-soft"),
          muted: rgb("--c-accent-muted"),
        },
        powder: {
          DEFAULT: rgb("--c-powder"),
          soft: rgb("--c-powder-soft"),
          muted: rgb("--c-powder-muted"),
        },
        lavender: {
          DEFAULT: rgb("--c-lavender"),
          soft: rgb("--c-lavender-soft"),
          muted: rgb("--c-lavender-muted"),
        },
        text: {
          DEFAULT: rgb("--c-text"),
          muted: rgb("--c-text-muted"),
          dim: rgb("--c-text-dim"),
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
