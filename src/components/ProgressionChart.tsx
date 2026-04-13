import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";
import type { Session } from "../types";
import { buildExerciseProgression } from "../lib/scoring";
import { cuesFor, objectiveFor } from "../data/programs";
import { Lightbulb, Target } from "lucide-react";

interface Props {
  sessions: Session[];
}

type Metric = "volume" | "intensity" | "pr";

const METRICS: Array<{
  key: Metric;
  label: string;
  sub: string;
  color: string;
  unit: string;
}> = [
  {
    key: "volume",
    label: "Volume total",
    sub: "Σ (poids × reps) par séance",
    color: "#a7e8c9",
    unit: "kg",
  },
  {
    key: "intensity",
    label: "Intensité travail",
    sub: "Charge max sur séries 6–12 reps",
    color: "#a8d0e6",
    unit: "kg",
  },
  {
    key: "pr",
    label: "Record absolu",
    sub: "Poids max soulevé (toutes reps)",
    color: "#c9b8e8",
    unit: "kg",
  },
];

// Progression par exercice : 3 métriques sélectionnables (volume / intensité
// dans la fenêtre 6–12 reps / record absolu). Chaque métrique a sa couleur
// pastel dédiée.
export function ProgressionChart({ sessions }: Props) {
  const exercises = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) for (const ex of s.exercices) set.add(ex.nom);
    return [...set].sort();
  }, [sessions]);

  const [selected, setSelected] = useState<string>(exercises[0] ?? "");
  const [metric, setMetric] = useState<Metric>("volume");

  const current = exercises.includes(selected) ? selected : exercises[0] ?? "";

  const series = useMemo(
    () => (current ? buildExerciseProgression(sessions, current) : []),
    [sessions, current],
  );

  // On filtre les points à 0 pour la métrique courante — un exercice cardio
  // n'a pas de charge, afficher une ligne plate à 0 n'a pas de sens.
  const data = useMemo(
    () => series.filter((p) => p[metric] > 0),
    [series, metric],
  );

  const cues = current ? cuesFor(current) : [];
  const objectif = current ? objectiveFor(current) : undefined;
  const active = METRICS.find((m) => m.key === metric)!;

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h3 className="text-sm font-semibold">Progression par exercice</h3>
        <select
          className="input !py-1 !px-2 text-xs w-auto"
          value={current}
          onChange={(e) => setSelected(e.target.value)}
          disabled={!exercises.length}
        >
          {exercises.length === 0 && <option>—</option>}
          {exercises.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur de métrique */}
      <div className="grid grid-cols-3 gap-1 mb-3 bg-bg-soft border border-border rounded-lg p-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={[
              "px-2 py-2 rounded-md text-xs font-medium transition-colors text-center",
              metric === m.key
                ? "bg-accent text-bg"
                : "text-text-muted hover:text-text",
            ].join(" ")}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: m.color }}
              />
              <span>{m.label}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="text-[11px] text-text-dim mb-3">{active.sub}</div>

      {(objectif || cues.length > 0) && (
        <div className="mb-3 space-y-2">
          {objectif && (
            <div className="flex items-start gap-2 text-xs text-accent-soft bg-accent-muted/20 border border-accent-muted/40 rounded-lg px-3 py-2">
              <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">Objectif :</strong> {objectif}
              </span>
            </div>
          )}
          {cues.length > 0 && (
            <ul className="space-y-1 bg-bg-soft border border-border rounded-lg p-3">
              {cues.map((c, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text-muted"
                >
                  <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-soft" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="h-[280px]">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-dim text-sm text-center px-4">
            {series.length === 0
              ? "Pas encore de données pour cet exercice."
              : `Aucune série ne correspond à cette métrique (${active.label.toLowerCase()}).`}
          </div>
        ) : metric === "volume" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={active.color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={active.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3138" />
              <XAxis dataKey="label" stroke="#8c95a0" fontSize={11} />
              <YAxis stroke="#8c95a0" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#1a1f24",
                  border: "1px solid #2a3138",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#a8b2bc" }}
                formatter={(v: number) => [`${v} ${active.unit}`, active.label]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={active.color}
                strokeWidth={2}
                fill="url(#progGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3138" />
              <XAxis dataKey="label" stroke="#8c95a0" fontSize={11} />
              <YAxis stroke="#8c95a0" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "#1a1f24",
                  border: "1px solid #2a3138",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#a8b2bc" }}
                formatter={(v: number) => [`${v} ${active.unit}`, active.label]}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={active.color}
                strokeWidth={2}
                dot={{ fill: active.color, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
