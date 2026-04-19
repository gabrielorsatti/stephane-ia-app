import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBadge() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
      <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg backdrop-blur">
        <WifiOff className="w-3.5 h-3.5" />
        Mode hors-ligne
      </div>
    </div>
  );
}
