import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const env = import.meta.env;
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || "peer-team-matcher",
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, env.VITE_FUNCTIONS_REGION || "asia-south1");

if (env.VITE_USE_EMULATORS === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
