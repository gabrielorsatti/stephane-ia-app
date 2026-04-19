import {
  Dumbbell,
  Home,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";
import type { Hub } from "./hubTypes";

interface Props {
  active: Hub;
  onChange: (h: Hub) => void;
  notifCount?: number;
}

const ITEMS: Array<{ id: Hub; label: string; icon: React.ReactNode }> = [
  { id: "home", label: "Accueil", icon: <Home className="w-5 h-5" /> },
  { id: "training", label: "Training", icon: <Dumbbell className="w-5 h-5" /> },
  { id: "nutrition", label: "Nutrition", icon: <Utensils className="w-5 h-5" /> },
  { id: "coach", label: "Coach", icon: <Sparkles className="w-5 h-5" /> },
  { id: "community", label: "Social", icon: <Users className="w-5 h-5" /> },
];

export function MobileBottomNav({ active, onChange, notifCount = 0 }: Props) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-card/95 backdrop-blur-lg"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((it) => {
          const on = active === it.id;
          const badge = it.id === "community" && notifCount > 0;
          return (
            <li key={it.id}>
              <button
                onClick={() => onChange(it.id)}
                className={[
                  "w-full py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all active:scale-95 relative",
                  on
                    ? "text-accent"
                    : "text-text-dim hover:text-text-muted",
                ].join(" ")}
                aria-current={on ? "page" : undefined}
              >
                {it.icon}
                <span>{it.label}</span>
                {badge && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
