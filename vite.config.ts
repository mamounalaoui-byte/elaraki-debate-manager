import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [dyadComponentTagger(), react(), VitePWA({
    registerType: "prompt",
    injectRegister: "auto",
    includeAssets: ["assets/*.png", "assets/*.jpg"],
    manifest: {
      name: "ELARAKI DEBATE MANAGER",
      short_name: "ELARAKI Debates",
      description: "French and English school debates, timers and posters.",
      theme_color: "#2468aa",
      background_color: "#faf9f7",
      display: "standalone",
      start_url: "/",
      icons: [{ src: "/assets/school-logo.jpg", sizes: "447x447", type: "image/jpeg", purpose: "any" }],
    },
    workbox: { globPatterns: ["**/*.{js,css,html,svg,png,jpg,woff2}"], maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, navigateFallback: "/index.html" },
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
