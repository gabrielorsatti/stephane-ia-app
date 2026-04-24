import { RefreshCw, X } from "lucide-react";
import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Nuke any stale Service Workers left over from the old github.io origin
// or from a previous deployment with a different scope.
function purgeLeacySW() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      const scope = reg.scope;
      // Unregister anything not scoped to the current origin root
      if (!scope.startsWith(window.location.origin + "/")) {
        void reg.unregister();
      }
    }
  });

  // Clear any lingering caches from old deployments
  if ("caches" in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.includes("github.io") || key.includes("stephane-ia-app")) {
          void caches.delete(key);
        }
      }
    });
  }
}

export function UpdateToast() {
  const intervalMS = 60 * 1000;

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        void registration.update();
      }, intervalMS);
    },
    onRegisterError(err) {
      console.error("[PWA] registration error", err);
    },
  });

  // Run legacy cleanup once on mount
  useEffect(() => {
    purgeLeacySW();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onControllerChange() {
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  if (!needRefresh) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)]"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 5rem)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className="card !p-3 flex items-center gap-3 shadow-2xl border-accent/40">
        <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">Mise à jour disponible</div>
          <div className="text-xs text-text-muted">
            Clique pour charger la nouvelle version.
          </div>
        </div>
        <button
          onClick={() => void updateServiceWorker(true)}
          className="btn-primary !py-1.5 !px-3 text-xs"
        >
          Rafraîchir
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Ignorer"
          className="btn-ghost !p-1.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
