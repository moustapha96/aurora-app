import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "../build",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Handle dynamic imports for tesseract.js
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    // Exclude tesseract.js from pre-bundling since it's loaded dynamically
    exclude: ["tesseract.js"],
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "generateSW",

      // Tous les assets présents dans /public
      includeAssets: [
        "favicon.ico",
        "placeholder.svg",
        "robots.txt",
        "aurora-favicon-16.png",
        "aurora-favicon-32.png",
        "aurora-favicon-48.png",
        "aurora-icon-180-apple-touch.png",
        "aurora-icon-192-pwa.png",
        "aurora-icon-256.png",
        "aurora-icon-384.png",
        "aurora-icon-512-pwa.png",
      ],

      manifest: {
        name: "Aurora Society - Société Exclusive Premium",
        short_name: "Aurora Society",
        description:
          "Une plateforme sociale exclusive dédiée à l'élite mondiale. Réseau, conciergerie de luxe, étiquette et voyages d'exception.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        display_override: ["standalone", "browser"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          // favicons PNG
          {
            src: "/aurora-favicon-16.png",
            sizes: "16x16",
            type: "image/png",
          },
          {
            src: "/aurora-favicon-32.png",
            sizes: "32x32",
            type: "image/png",
          },
          {
            src: "/aurora-favicon-48.png",
            sizes: "48x48",
            type: "image/png",
          },

          // Apple touch icon
          {
            src: "/aurora-icon-180-apple-touch.png",
            sizes: "180x180",
            type: "image/png",
          },

          // PWA / Android
          {
            src: "/aurora-icon-192-pwa.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/aurora-icon-256.png",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: "/aurora-icon-384.png",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: "/aurora-icon-512-pwa.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "aurora-pages-cache",
              networkTimeoutSeconds: 10,
            },
          },
          // Google Fonts (CSS)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts (fonts)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },

      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
