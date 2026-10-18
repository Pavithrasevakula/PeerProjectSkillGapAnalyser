import { useSyncExternalStore } from "react";
import { applyUpdate, isUpdateAvailable, subscribeToUpdates } from "../pwa.js";

function subscribeOnline(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const getOnline = () => navigator.onLine;

/**
 * Accessible status messages for connection loss and new app versions.
 * Replaces ad-hoc DOM toasts: announced politely to screen readers, no timers to leak.
 */
export default function PwaStatus() {
  const online = useSyncExternalStore(subscribeOnline, getOnline, () => true);
  const updateAvailable = useSyncExternalStore(subscribeToUpdates, isUpdateAvailable, () => false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-5">
      <div role="status" aria-live="polite" className="contents">
        {!online && (
          <p className="pointer-events-auto rounded-[10px] bg-[#7a2e2a] px-4 py-2.5 text-xs font-bold text-white shadow-lg">
            You are offline. Some features are unavailable until you reconnect.
          </p>
        )}
        {updateAvailable && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-[10px] bg-pine px-4 py-2.5 text-xs font-bold text-white shadow-lg">
            <span>A new version of TeamSync is ready.</span>
            <button
              type="button"
              onClick={applyUpdate}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-pine hover:bg-[#eef3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Reload to update
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
