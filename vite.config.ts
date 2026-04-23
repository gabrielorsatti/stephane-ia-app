import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// `base` est exigé par GitHub Pages quand le site est servi sous un
// sous-chemin (https://<user>.github.io/<repo>/). En dev local on reste à "/".
const base = process.env.GITHUB_ACTIONS ? "/stephane-ia-app/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Stephane IA",
        short_name: "Stephane IA",
        description:
          "Suivi de musculation avec saisie en langage naturel et statistiques.",
        theme_color: "#a7e8c9",
        background_color: "#0f1316",
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
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ["recharts"],
          markdown: ["react-markdown", "remark-gfm"],
        },
      },
    },
  },
  server: { port: 5173, open: true },
});
