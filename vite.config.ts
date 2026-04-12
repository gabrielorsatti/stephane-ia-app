import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// `base` est exigé par GitHub Pages quand le site est servi sous un
// sous-chemin (https://<user>.github.io/<repo>/). En dev local on reste à "/".
const base = process.env.GITHUB_ACTIONS ? "/Personnal-gym-tracker/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Personal Gym Tracker",
        short_name: "Gym Tracker",
        description:
          "Suivi de musculation avec saisie en langage naturel et statistiques.",
        theme_color: "#f97316",
        background_color: "#0a0a0b",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  server: { port: 5173, open: true },
});
