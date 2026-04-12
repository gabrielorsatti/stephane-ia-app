import { Dumbbell, Flame, Scale, TrendingUp } from "lucide-react";
import type { Session } from "../types";
import { sessionScore, sessionVolume } from "../lib/scoring";

interface Props {
  sessions: Session[];
  bodyWeight?: number;
}

// Cartes KPI : volume total, séances, poids de corps, score moyen.
export function StatsCards({ sessions, bodyWeight }: Props) {
  const totalVolume = sessions.reduce((acc, s) => acc + sessionVolume(s), 0);

  const last30 = sessions.filter((s) => {
    const d = new Date(s.date).getTime();
    return Date.now() - d < 30 * 24 * 3600 * 1000;
  });
  const volume30 = last30.reduce((acc, s) => acc + sessionVolume(s), 0);

  const avgScore =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + sessionScore(s), 0) /
            sessions.length,
        )
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Kpi
        icon={<Dumbbell className="w-5 h-5" />}
        label="Volume total"
        value={`${formatKg(totalVolume)}`}
        hint={`${sessions.length} séances`}
      />
      <Kpi
        icon={<Flame className="w-5 h-5" />}
        label="Volume 30j"
        value={`${formatKg(volume30)}`}
        hint={`${last30.length} séances`}
      />
      <Kpi
        icon={<Scale className="w-5 h-5" />}
        label="Poids de corps"
        value={bodyWeight ? `${bodyWeight} kg` : "—"}
        hint="Dernière mesure"
      />
      <Kpi
        icon={<TrendingUp className="w-5 h-5" />}
        label="Score moyen"
        value={`${avgScore}`}
        hint="Volume + intensité"
      />
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card space-y-2">
      <div className="flex items-center justify-between text-text-muted">
        <span className="text-xs uppercase tracking-wide">{label}</span>
        <span className="text-accent">{icon}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-text-dim">{hint}</div>}
    </div>
  );
}

function formatKg(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`;
  return `${Math.round(v)} kg`;
}
