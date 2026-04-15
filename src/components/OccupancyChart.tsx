import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildOccupancyCurve,
  type OccupancyLevel,
} from "../lib/occupancyModel";
import { useChartColors } from "../hooks/useChartColors";

const LEVELS: Array<{ key: OccupancyLevel; label: string }> = [
  { key: "calme", label: "Calme" },
  { key: "normal", label: "Normal" },
  { key: "bonde", label: "Bondée" },
];

const KEY = "gym-tracker:occupancy-level";

// Widget d'affluence prédictive. IMPORTANT : ce n'est PAS de la donnée live
// — les pages publiques de Basic-Fit, Fitness Park, etc. n'exposent pas
// d'affluence en temps réel (investigation 2026-04). On affiche donc une
// estimation basée sur les heures typiques de fréquentation d'une salle
// urbaine, ajustable via le sélecteur de niveau de la salle.
export function OccupancyChart() {
  const c = useChartColors();
  const [level, setLevel] = useState<OccupancyLevel>(() => {
    const saved = localStorage.getItem(KEY);
    return saved === "calme" || saved === "bonde" ? saved : "normal";
  });
  const currentHour = new Date().getHours();
  const data = useMemo(
    () => buildOccupancyCurve(level, currentHour),
    [level, currentHour],
  );
  const nowValue = data[currentHour].value;

  function setAndSave(next: OccupancyLevel) {
    setLevel(next);
    localStorage.setItem(KEY, next);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold">Affluence prévisible</h3>
        </div>
        <span className="chip bg-bg-elev text-text-muted">
          Maintenant · ~{nowValue}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 mb-3 bg-bg-soft border border-border rounded-lg p-1">
        {LEVELS.map((l) => {
          const on = level === l.key;
          return (
            <button
              key={l.key}
              onClick={() => setAndSave(l.key)}
              className={[
                "px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                on ? "bg-accent text-bg" : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
            <XAxis
              dataKey="label"
              stroke={c.axis}
              fontSize={10}
              interval={2}
            />
            <YAxis stroke={c.axis} fontSize={10} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: c.textMuted }}
              formatter={(v: number) => [`${v}%`, "Estimation"]}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {data.map((p) => (
                <Cell
                  key={p.hour}
                  fill={p.isCurrent ? c.c1 : c.c3}
                  fillOpacity={p.isCurrent ? 1 : 0.55}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-start gap-2 mt-3 text-[11px] text-text-dim">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Estimation basée sur les horaires typiques — les chaînes ne publient
          pas d'affluence temps réel sur leur site public. Ajuste le niveau
          selon ta salle.
        </span>
      </div>
    </div>
  );
}
