import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeFeatures } from "./lib/capacitor";

// Initialize native features for Capacitor
initNativeFeatures();

createRoot(document.getElementById("root")!).render(<App />);
