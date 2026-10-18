export const REQUIRED_FIREBASE_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

/** Names of required Firebase env vars that are missing or blank (values are never returned). */
export function getMissingFirebaseVars(env = {}) {
  return REQUIRED_FIREBASE_VARS.filter((name) => {
    const value = env[name];
    return typeof value !== "string" || value.trim() === "";
  });
}

/**
 * Resolve the Firebase web config from Vite env vars.
 * When running against the local emulators, placeholder values are allowed.
 * Otherwise any missing variable is reported in `missing` so the app can show a clear
 * configuration error instead of failing with an opaque "API key not valid" message.
 */
export function resolveFirebaseConfig(env = {}) {
  const emulator = env.VITE_USE_EMULATORS === "true";
  const missing = emulator ? [] : getMissingFirebaseVars(env);
  const placeholder = emulator ? "demo" : "missing-config";
  return {
    emulator,
    missing,
    config: {
      apiKey: env.VITE_FIREBASE_API_KEY || `${placeholder}-key`,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${placeholder}.firebaseapp.com`,
      projectId: env.VITE_FIREBASE_PROJECT_ID || `${placeholder}-project`,
      appId: env.VITE_FIREBASE_APP_ID || `1:0:web:${placeholder}`,
      // Optional: only needed for profile video uploads (Firebase Storage).
      ...(env.VITE_FIREBASE_STORAGE_BUCKET ? { storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET } : {}),
      ...(env.VITE_FIREBASE_MESSAGING_SENDER_ID ? { messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID } : {}),
    },
  };
}
