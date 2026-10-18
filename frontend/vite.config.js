import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // The Firebase SDK (~600 kB minified, ~180 kB gzipped) is the floor for this app; it is
    // isolated in its own long-cached chunk below, so only unexpected growth should warn.
    chunkSizeWarningLimit: 650,
    rolldownOptions: {
      output: {
        // Split third-party code from app code so a deployment that only changes app code
        // does not invalidate the (large) Firebase and React bundles in users' caches.
        codeSplitting: {
          groups: [
            { name: "firebase", test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 30 },
            { name: "react", test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 20 },
          ],
        },
      },
    },
  },
});
