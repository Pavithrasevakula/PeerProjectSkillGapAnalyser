import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { resolveFirebaseConfig } from "./lib/firebaseConfig";

const env = import.meta.env;

// `missingFirebaseVars` is checked in main.jsx; when it is non-empty the app shows a
// configuration error screen and never talks to Firebase.
const { config, missing, emulator } = resolveFirebaseConfig(env);
export const missingFirebaseVars = missing;

const app = initializeApp(config);

// Email/password only: initialising Auth without a popup/redirect resolver stops the SDK from
// loading Google's gapi script (https://apis.google.com), so a strict script-src CSP works.
function createAuth() {
  try {
    return initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  } catch (error) {
    // Hot module reload re-runs this file; reuse the instance that already exists.
    if (error?.code === "auth/already-initialized") return getAuth(app);
    throw error;
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION || "asia-south1");

if (emulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
