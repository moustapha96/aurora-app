// Initialize polyfills FIRST - before any other imports
import { initPolyfills } from "./lib/polyfills";
initPolyfills();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeFeatures } from "./lib/capacitor";

// Initialize native features for Capacitor
initNativeFeatures();

// Enregistrer le service worker pour PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker enregistré avec succès:', registration.scope);
      })
      .catch((error) => {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
