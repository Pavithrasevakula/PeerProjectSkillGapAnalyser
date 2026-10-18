import { describe, expect, it } from "vitest";
import { REQUIRED_FIREBASE_VARS, getMissingFirebaseVars, resolveFirebaseConfig } from "./firebaseConfig";

const complete = {
  VITE_FIREBASE_API_KEY: "key",
  VITE_FIREBASE_AUTH_DOMAIN: "app.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "app",
  VITE_FIREBASE_APP_ID: "1:1:web:1",
};

describe("getMissingFirebaseVars", () => {
  it("reports nothing for a complete environment", () => {
    expect(getMissingFirebaseVars(complete)).toEqual([]);
  });

  it("reports every variable when the environment is empty", () => {
    expect(getMissingFirebaseVars({})).toEqual(REQUIRED_FIREBASE_VARS);
    expect(getMissingFirebaseVars()).toEqual(REQUIRED_FIREBASE_VARS);
  });

  it("treats blank and non-string values as missing", () => {
    const missing = getMissingFirebaseVars({ ...complete, VITE_FIREBASE_API_KEY: "   ", VITE_FIREBASE_APP_ID: undefined });
    expect(missing).toEqual(["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_APP_ID"]);
  });

  it("never returns variable values", () => {
    expect(JSON.stringify(getMissingFirebaseVars({ VITE_FIREBASE_API_KEY: "secret-value" }))).not.toContain("secret-value");
  });
});

describe("resolveFirebaseConfig", () => {
  it("uses the provided values and includes optional ones only when set", () => {
    const { config, missing } = resolveFirebaseConfig({ ...complete, VITE_FIREBASE_STORAGE_BUCKET: "app.firebasestorage.app" });
    expect(missing).toEqual([]);
    expect(config.apiKey).toBe("key");
    expect(config.storageBucket).toBe("app.firebasestorage.app");
    expect(config).not.toHaveProperty("messagingSenderId");
  });

  it("flags missing configuration instead of silently using a demo key", () => {
    const { missing, config, emulator } = resolveFirebaseConfig({});
    expect(emulator).toBe(false);
    expect(missing).toHaveLength(REQUIRED_FIREBASE_VARS.length);
    expect(config.apiKey).toBe("missing-config-key");
  });

  it("allows placeholder config only for emulator runs", () => {
    const { missing, emulator, config } = resolveFirebaseConfig({ VITE_USE_EMULATORS: "true" });
    expect(emulator).toBe(true);
    expect(missing).toEqual([]);
    expect(config.apiKey).toBe("demo-key");
  });

  it("does not enable the emulator for other truthy-looking values", () => {
    expect(resolveFirebaseConfig({ ...complete, VITE_USE_EMULATORS: "1" }).emulator).toBe(false);
    expect(resolveFirebaseConfig({ ...complete, VITE_USE_EMULATORS: "false" }).emulator).toBe(false);
  });
});
