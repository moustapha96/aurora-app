import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Plugin pour supprimer le dossier de build avant le build
const cleanBuildDir = () => {
  return {
    name: "clean-build-dir",
    buildStart() {
      const buildDir = path.resolve(__dirname, "./dist");
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true, force: true });
        console.log(`✓ Dossier de build supprimé: ${buildDir}`);
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    cleanBuildDir(),
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "./dist"),
    emptyOutDir: false, // Désactivé car on le fait manuellement avec le plugin
    // Réduire la mise en cache avec des noms de fichiers non hashés en dev
    rollupOptions: {
      output: {
        // Utiliser des noms de fichiers plus simples pour éviter le cache
        entryFileNames: mode === "production" ? "assets/[name].[hash].js" : "assets/[name].js",
        chunkFileNames: mode === "production" ? "assets/[name].[hash].js" : "assets/[name].js",
        assetFileNames: mode === "production" ? "assets/[name].[hash].[ext]" : "assets/[name].[ext]",
      },
    },
  },
  // Réduire le cache de Vite
  cacheDir: "node_modules/.vite",
  optimizeDeps: {
    force: mode === "development", // Forcer la re-optimisation en dev
  },
}));
