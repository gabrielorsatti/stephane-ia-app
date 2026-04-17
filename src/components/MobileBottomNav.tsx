import {
  Dumbbell,
  History,
  LayoutDashboard,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  Utensils,
  X,
  BookOpen,
  Shield,
} from "lucide-react";
import { useState } from "react";

export type MobileTab =
  | "dashboard"
  | "historique"
  | "progression"
  | "alimentation"
  | "programme"
  | "exercices"
  | "coach"
  | "social"
  | "admin";

interface Props {
  active: string;
  onChange: (t: MobileTab) => void;
  isAdmin?: boolean;
}

const PRIMARY: Array<{
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "dashboard", label: "Accueil", icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: "historique", label: "Séances", icon: <History className="w-5 h-5" /> },
  { id: "coach", label: "Coach", icon: <Sparkles className="w-5 h-5" /> },
  { id: "social", label: "Social", icon: <Users className="w-5 h-5" /> },
];

const SECONDARY: Array<{
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "progression", label: "Progression", icon: <TrendingUp className="w-5 h-5" /> },
  { id: "alimentation", label: "Alimentation", icon: <Utensils className="w-5 h-5" /> },
  { id: "programme", label: "Programmes", icon: <BookOpen className="w-5 h-5" /> },
  { id: "exercices", label: "Exercices", icon: <Dumbbell className="w-5 h-5" /> },
];

export function MobileBottomNav({ active, onChange, isAdmin }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isSecondary =
    SECONDARY.some((s) => s.id === active) || active === "admin";

  function navigate(id: MobileTab) {
    onChange(id);
    setDrawerOpen(false);
  }

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-bg-card border-t border-border rounded-t-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span className="text-sm font-semibold">Plus</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-bg-elev text-text-muted active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 px-3 pb-4">
              {SECONDARY.map((it) => (
                <DrawerItem
                  key={it.id}
                  icon={it.icon}
                  label={it.label}
                  active={active === it.id}
                  onClick={() => navigate(it.id)}
                />
              ))}
              {isAdmin && (
                <DrawerItem
                  icon={<Shield className="w-5 h-5" />}
                  label="Admin"
                  active={active === "admin"}
                  onClick={() => navigate("admin")}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-bg-card/95 backdrop-blur-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navigation principale"
      >
        <ul className="grid grid-cols-5">
          {PRIMARY.map((it) => {
            const on = active === it.id;
            return (
              <li key={it.id}>
                <button
                  onClick={() => navigate(it.id)}
                  className={[
                    "w-full py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all active:scale-95",
                    on
                      ? "text-accent"
                      : "text-text-dim hover:text-text-muted",
                  ].join(" ")}
                  aria-current={on ? "page" : undefined}
                >
                  {it.icon}
                  <span>{it.label}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setDrawerOpen((v) => !v)}
              className={[
                "w-full py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all active:scale-95",
                isSecondary || drawerOpen
                  ? "text-accent"
                  : "text-text-dim hover:text-text-muted",
              ].join(" ")}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>Plus</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

function DrawerItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex flex-col items-center gap-1.5 py-3 rounded-xl text-[11px] font-medium transition-all active:scale-95",
        active
          ? "bg-accent/15 text-accent"
          : "text-text-muted hover:bg-bg-soft",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
