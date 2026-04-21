import {
  Dumbbell,
  Home,
  Settings,
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

const MAIN: Array<{ id: Hub; label: string; icon: React.ReactNode }> = [
  { id: "home", label: "Accueil", icon: <Home className="w-5 h-5" /> },
  { id: "training", label: "Training", icon: <Dumbbell className="w-5 h-5" /> },
  { id: "nutrition", label: "Nutrition", icon: <Utensils className="w-5 h-5" /> },
  { id: "coach", label: "Coach", icon: <Sparkles className="w-5 h-5" /> },
  { id: "community", label: "Communauté", icon: <Users className="w-5 h-5" /> },
];

export function Sidebar({ active, onChange, notifCount = 0 }: Props) {
  function renderItem(it: (typeof MAIN)[number]) {
    const on = active === it.id;
    const badge = it.id === "community" && notifCount > 0;
    return (
      <button
        key={it.id}
        onClick={() => onChange(it.id)}
        className={[
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
          on
            ? "bg-accent/15 text-accent"
            : "text-text-muted hover:text-text hover:bg-bg-elev",
        ].join(" ")}
      >
        {it.icon}
        <span>{it.label}</span>
        {badge && (
          <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
            {notifCount > 9 ? "9+" : notifCount}
          </span>
        )}
      </button>
    );
  }

  const settingsOn = active === "settings";

  return (
    <aside className="hidden md:flex flex-col w-48 shrink-0 border-r border-border bg-bg-soft/60 py-4 px-2 sticky top-[57px] h-[calc(100vh-57px)]">
      <div className="flex flex-col gap-1 flex-1">
        {MAIN.map(renderItem)}
      </div>

      <div className="border-t border-border mt-2 pt-2">
        <button
          onClick={() => onChange("settings")}
          className={[
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
            settingsOn
              ? "bg-accent/15 text-accent"
              : "text-text-muted hover:text-text hover:bg-bg-elev",
          ].join(" ")}
        >
          <Settings className="w-5 h-5" />
          <span>Réglages</span>
        </button>
      </div>
    </aside>
  );
}
