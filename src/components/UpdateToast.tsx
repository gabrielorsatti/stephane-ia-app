import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

// Toast discret affiché quand une nouvelle version du service worker est
// disponible. L'utilisateur clique pour rafraîchir — plus propre qu'une mise
// à jour automatique qui peut casser une session en cours.
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.error("[PWA] registration error", err);
    },
  });

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
