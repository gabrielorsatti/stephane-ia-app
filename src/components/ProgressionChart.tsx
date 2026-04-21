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
import type { PersonalRecordOverride, Session } from "../types";
import { buildExerciseProgression } from "../lib/scoring";
import { exerciseType } from "../lib/exercises";
import { computePace, formatPace } from "../lib/cardio";
import { cuesFor, objectiveFor } from "../data/programs";
import { useChartColors } from "../hooks/useChartColors";
import { Lightbulb, Target } from "lucide-react";

interface Props {
  sessions: Session[];
  overrides?: PersonalRecordOverride[];
}

type Metric = "volume" | "intensity" | "pr";
type CardioMetric = "distance" | "pace" | "duree";
type ColorKey = "c1" | "c2" | "c3";

const METRICS: Array<{
  key: Metric;
  label: string;
  sub: string;
  colorKey: ColorKey;
  unit: string;
}> = [
  {
    key: "volume",
    label: "Volume total",
    sub: "Σ (poids × reps) par séance",
    colorKey: "c1",
    unit: "kg",
  },
  {
    key: "intensity",
    label: "Intensité travail",
    sub: "Charge max sur séries 6–12 reps",
    colorKey: "c2",
    unit: "kg",
  },
  {
    key: "pr",
    label: "Record absolu",
    sub: "Poids max soulevé (toutes reps)",
    colorKey: "c3",
    unit: "kg",
  },
];

const CARDIO_METRICS: Array<{
  key: CardioMetric;
  label: string;
  sub: string;
  colorKey: ColorKey;
  unit: string;
}> = [
  {
    key: "distance",
    label: "Distance",
    sub: "Kilomètres parcourus par séance",
    colorKey: "c1",
    unit: "km",
  },
  {
    key: "pace",
    label: "Allure moyenne",
    sub: "min/km — plus bas = plus rapide",
    colorKey: "c2",
    unit: "min/km",
  },
  {
    key: "duree",
    label: "Temps d'effort",
    sub: "Durée totale par séance",
    colorKey: "c3",
    unit: "min",
  },
];

// Progression par exercice : 3 métriques sélectionnables (volume / intensité
// dans la fenêtre 6–12 reps / record absolu). Chaque métrique a sa couleur
// pastel dédiée.
export function ProgressionChart({ sessions, overrides = [] }: Props) {
  const c = useChartColors();
  const exercises = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) for (const ex of s.exercices) set.add(ex.nom);
    return [...set].sort();
  }, [sessions]);

  const [selected, setSelected] = useState<string>(exercises[0] ?? "");
  const [metric, setMetric] = useState<Metric>("volume");
  const [cardioMetric, setCardioMetric] = useState<CardioMetric>("distance");

  const current = exercises.includes(selected) ? selected : exercises[0] ?? "";
  const isCardio = current ? exerciseType(current) === "cardio" : false;

  const series = useMemo(() => {
    if (!current || isCardio) return [];
    const base = buildExerciseProgression(sessions, current);
    const ov = overrides.find((o) => o.nom === current);
    if (!ov) return base;
    // Le PR manuel fait foi : si une date est fournie, on booste le point
    // correspondant ; sinon on crée un point synthétique en fin de série
    // pour que l'utilisateur voie immédiatement l'effet de son édition.
    const next = base.map((p) => ({ ...p }));
    const pr = ov.maxPoids ?? 0;
    const intensity =
      ov.maxPoids != null &&
      ov.maxPoidsReps != null &&
      ov.maxPoidsReps >= 6 &&
      ov.maxPoidsReps <= 12
        ? ov.maxPoids
        : 0;
    if (pr > 0 || intensity > 0) {
      const date = ov.maxPoidsDate;
      const idx = date ? next.findIndex((p) => p.date === date) : -1;
      if (idx >= 0) {
        next[idx].pr = Math.max(next[idx].pr, pr);
        next[idx].intensity = Math.max(next[idx].intensity, intensity);
      } else {
        const label = date
          ? date.slice(5).replace("-", "/")
          : "PR";
        next.push({
          date: date ?? "9999-12-31",
          label,
          volume: 0,
          intensity,
          pr,
        });
      }
    }
    return next.sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [sessions, current, isCardio, overrides]);

  // Série cardio : pour chaque séance contenant l'exercice cardio sélectionné,
  // on extrait distance / durée / allure calculée. Tri chronologique.
  const cardioSeries = useMemo(() => {
    if (!current || !isCardio) return [];
    const sorted = [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1));
    const out: Array<{
      date: string;
      label: string;
      distance: number;
      duree: number;
      pace: number;
    }> = [];
    for (const s of sorted) {
      const ex = s.exercices.find((e) => e.nom === current);
      if (!ex?.cardio) continue;
      const pace = computePace(ex.cardio);
      out.push({
        date: s.date,
        label: s.date.slice(5).replace("-", "/"),
        distance: ex.cardio.distance ?? 0,
        duree: ex.cardio.duree ?? 0,
        pace: pace ?? 0,
      });
    }
    return out;
  }, [sessions, current, isCardio]);

  const data = useMemo(() => {
    if (isCardio) {
      return cardioSeries.filter((p) => p[cardioMetric] > 0);
    }
    return series.filter((p) => p[metric] > 0);
  }, [series, cardioSeries, metric, cardioMetric, isCardio]);

  const cues = current ? cuesFor(current) : [];
  const objectif = current ? objectiveFor(current) : undefined;
  const active = isCardio
    ? CARDIO_METRICS.find((m) => m.key === cardioMetric)!
    : METRICS.find((m) => m.key === metric)!;

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

      {/* Sélecteur de métrique — cardio ou muscu selon le type */}
      <div className="grid grid-cols-3 gap-1 mb-3 bg-bg-soft border border-border rounded-lg p-1">
        {(isCardio ? CARDIO_METRICS : METRICS).map((m) => {
          const on = isCardio ? cardioMetric === m.key : metric === m.key;
          return (
            <button
              key={m.key}
              onClick={() =>
                isCardio
                  ? setCardioMetric(m.key as CardioMetric)
                  : setMetric(m.key as Metric)
              }
              className={[
                "px-2 py-2 rounded-md text-xs font-medium transition-colors text-center",
                on ? "bg-accent text-bg" : "text-text-muted hover:text-text",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: c[m.colorKey] }}
                />
                <span>{m.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-xs text-text-dim mb-3">{active.sub}</div>

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
            {(isCardio ? cardioSeries : series).length === 0
              ? "Pas encore de données pour cet exercice."
              : `Aucune série ne correspond à cette métrique (${active.label.toLowerCase()}).`}
          </div>
        ) : (isCardio ? cardioMetric === "distance" : metric === "volume") ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="progGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c[active.colorKey]} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={c[active.colorKey]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="label" stroke={c.axis} fontSize={11} />
              <YAxis stroke={c.axis} fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: c.textMuted }}
                formatter={(v: number) => [
                  isCardio && active.key === "pace"
                    ? `${formatPace(v)} min/km`
                    : `${v} ${active.unit}`,
                  active.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey={active.key}
                stroke={c[active.colorKey]}
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
              <YAxis
                stroke="#8c95a0"
                fontSize={11}
                tickFormatter={(v: number) =>
                  isCardio && active.key === "pace" ? formatPace(v) : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1f24",
                  border: "1px solid #2a3138",
                  borderRadius: 8,
                }}
                labelStyle={{ color: "#a8b2bc" }}
                formatter={(v: number) => [
                  isCardio && active.key === "pace"
                    ? `${formatPace(v)} min/km`
                    : `${v} ${active.unit}`,
                  active.label,
                ]}
              />
              <Line
                type="monotone"
                dataKey={active.key}
                stroke={c[active.colorKey]}
                strokeWidth={2}
                dot={{ fill: c[active.colorKey], r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
