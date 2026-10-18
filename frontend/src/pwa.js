// Service worker registration and update tracking.
//
// A new service worker waits until the user chooses to update (see PwaStatus), so the page is
// never reloaded while someone is filling in a form.

const listeners = new Set();
let waitingWorker = null;
let updateRequested = false;

function setWaiting(worker) {
  waitingWorker = worker;
  listeners.forEach((listener) => listener());
}

/** Subscribe to "update available" changes (compatible with useSyncExternalStore). */
export function subscribeToUpdates(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isUpdateAvailable() {
  return waitingWorker !== null;
}

/** Ask the waiting worker to take over; the page reloads once the new worker is in control. */
export function applyUpdate() {
  if (!waitingWorker) return;
  updateRequested = true;
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

function trackRegistration(registration) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    setWaiting(registration.waiting);
  }
  registration.addEventListener("updatefound", () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      // "installed" with an existing controller means an older version is still running.
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        setWaiting(installing);
      }
    });
  });
}

async function removeDevelopmentWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("teamsync-")).map((key) => caches.delete(key)));
    }
  } catch {
    // Best-effort cleanup only.
  }
}

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  // A cache-first worker would serve stale /src modules and break Vite HMR in development,
  // so the worker only runs in production builds.
  if (!import.meta.env.PROD) {
    removeDevelopmentWorkers();
    return;
  }

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // Reload only when the user asked for the update, never on first install.
    if (!updateRequested || reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        trackRegistration(registration);
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });
  });
}
