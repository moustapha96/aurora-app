import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Écoute sur toutes les interfaces IPv4 (plus sûr pour les WS que "::" sur certains environnements)
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    hmr: {
      // Utilise toujours localhost côté navigateur pour la connexion WebSocket HMR
      host: "localhost",
      port: 8080,
      protocol: "ws",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
}));
