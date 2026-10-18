import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ConfigError from "./components/ConfigError.jsx";
import { missingFirebaseVars } from "./firebase";
import { registerServiceWorker } from "./pwa.js";
import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource-variable/manrope/wght.css";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {missingFirebaseVars.length > 0 ? (
      <ConfigError missing={missingFirebaseVars} />
    ) : (
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    )}
  </React.StrictMode>
);

registerServiceWorker();
