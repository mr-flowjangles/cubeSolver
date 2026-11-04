import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves the app under /cubeSolver/; local dev and Docker serve it at /.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  // Three.js alone is ~500 kB; the app is cached offline, so one chunk is fine.
  build: { chunkSizeWarningLimit: 800 },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Cube Solver",
        short_name: "Cube Solver",
        description: "Learn to solve a Rubik's cube, from your first solve to CFOP.",
        theme_color: "#0a9b48",
        background_color: "#14161b",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
