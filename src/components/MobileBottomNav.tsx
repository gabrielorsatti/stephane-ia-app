import {
  History,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";

export type MobileTab =
  | "dashboard"
  | "historique"
  | "coach"
  | "progression"
  | "alimentation";

interface Props {
  active: string;
  onChange: (t: MobileTab) => void;
}

// Bottom navigation fixée au bas de l'écran mobile. Respecte safe-area-inset-bottom
// pour ne pas être masquée par la barre home de l'iPhone.
export function MobileBottomNav({ active, onChange }: Props) {
  const items: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> =
    [
      { id: "dashboard", label: "Accueil", icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: "historique", label: "Séances", icon: <History className="w-5 h-5" /> },
      { id: "alimentation", label: "Repas", icon: <Utensils className="w-5 h-5" /> },
      { id: "coach", label: "Coach", icon: <Sparkles className="w-5 h-5" /> },
      { id: "progression", label: "Progrès", icon: <TrendingUp className="w-5 h-5" /> },
    ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation principale"
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const on = active === it.id;
          return (
            <li key={it.id}>
              <button
                onClick={() => onChange(it.id)}
                className={[
                  "w-full py-2 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors",
                  on ? "text-accent" : "text-text-dim hover:text-text-muted",
                ].join(" ")}
                aria-current={on ? "page" : undefined}
              >
                {it.icon}
                <span>{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
