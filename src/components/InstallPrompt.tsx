import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "stephane-ia:install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));

  useEffect(() => {
    if (dismissed) return;
    if (isStandalone()) return;

    if (isIos()) {
      setShowIos(true);
      return;
    }

    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIos(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    dismiss();
  }

  if (dismissed || (!deferredPrompt && !showIos)) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-40 max-w-sm mx-auto animate-fadeIn">
      <div className="card border border-accent/30 shadow-lg shadow-accent/10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Installer Stephane IA</p>
              <p className="text-xs text-text-muted">Accès rapide depuis ton écran d'accueil</p>
            </div>
          </div>
          <button onClick={dismiss} className="p-1 text-text-dim hover:text-text-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIos ? (
          <div className="bg-bg-soft border border-border rounded-lg p-3 text-xs text-text-muted space-y-1.5">
            <p className="font-medium text-text">Pour installer sur iOS :</p>
            <p className="flex items-center gap-1.5">
              <Share className="w-3.5 h-3.5 text-accent shrink-0" />
              Appuie sur le bouton <span className="font-semibold">Partager</span>
            </p>
            <p className="pl-5">
              Puis choisis <span className="font-semibold">"Sur l'écran d'accueil"</span>
            </p>
          </div>
        ) : (
          <button onClick={() => void install()} className="btn-primary w-full !py-2.5 text-sm">
            <Download className="w-4 h-4" />
            Installer l'application
          </button>
        )}
      </div>
    </div>
  );
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone);
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
