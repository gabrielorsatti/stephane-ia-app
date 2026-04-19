import { Logo } from "./Logo";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
      <div className="animate-splash-logo">
        <div className="w-16 h-16 rounded-2xl border border-border bg-bg-card flex items-center justify-center text-accent shadow-lg">
          <Logo size={36} />
        </div>
      </div>
      <div className="mt-5 text-sm font-semibold text-text animate-splash-text">
        Personal Gym Tracker
      </div>
      <div className="mt-1.5 text-[11px] text-text-dim animate-splash-text">
        Chargement…
      </div>
    </div>
  );
}
