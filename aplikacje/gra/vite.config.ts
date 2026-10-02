import obslugaReact from "@vitejs/plugin-react";
import { defineConfig as zdefiniujKonfiguracje } from "vite";
import { VitePWA as pwa } from "vite-plugin-pwa";

export default zdefiniujKonfiguracje({
  plugins: [
    obslugaReact(),
    pwa({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["ikona-192.png", "ikona-512.png"],
      manifest: {
        name: "Kronika nad Regą — Zwiedzanie Trzebiatowa",
        short_name: "Kronika",
        lang: "pl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#304a39",
        background_color: "#f7f3e9",
        icons: [
          { src: "/ikona-192.png", sizes: "192x192", type: "image/png" },
          { src: "/ikona-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,png,svg,json}"],
        globIgnores: ["**/.vite/**"],
        navigateFallback: "index.html",
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
      },
    }),
  ],
  build: { manifest: true },
});
