import { AlertTriangle, Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

const APP_VERSION = 2;

interface VersionInfo {
  minVersion: number;
  message?: string;
}

export function ForceUpdate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkVersion();
  }, []);

  async function checkVersion() {
    try {
      const res = await fetch("/version.json?_=" + Date.now(), {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data: VersionInfo = await res.json();
      if (APP_VERSION < data.minVersion) {
        setMessage(
          data.message || "Une mise à jour est requise.",
        );
        setBlocked(true);
      }
    } catch {
      // Network error = offline, don't block
    }
  }

  async function handleReinstall() {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    window.location.reload();
  }

  if (!blocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-bg flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-text">Mise à jour requise</h1>
        <p className="text-sm text-text-muted">{message}</p>

        <div className="space-y-3">
          <button onClick={handleReinstall} className="btn-primary w-full flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Mettre à jour maintenant
          </button>

          <div className="text-xs text-text-dim space-y-2 bg-bg-soft border border-border rounded-lg p-4 text-left">
            <p className="font-medium text-text-muted">Si le bouton ne fonctionne pas :</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Supprimez l'app de votre écran d'accueil</li>
              <li>Ouvrez <strong>Safari</strong> et allez sur <strong>app.stephane.fit</strong></li>
              <li>
                Appuyez sur{" "}
                <Download className="w-3 h-3 inline" />{" "}
                Partager → «&nbsp;Sur l'écran d'accueil&nbsp;»
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
