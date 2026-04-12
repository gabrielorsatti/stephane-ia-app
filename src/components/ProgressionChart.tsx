import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import type { Session } from "../types";
import { bestEstimated1RM } from "../lib/scoring";
import { cuesFor, objectiveFor } from "../data/programs";
import { Lightbulb, Target } from "lucide-react";

interface Props {
  sessions: Session[];
}

// Suivi de progression par mouvement : meilleure charge et 1RM estimé par séance.
export function ProgressionChart({ sessions }: Props) {
  const exercises = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) for (const ex of s.exercices) set.add(ex.nom);
    return [...set].sort();
  }, [sessions]);

  const [selected, setSelected] = useState<string>(exercises[0] ?? "");

  // Maintient une sélection valide si la liste change.
  const current = exercises.includes(selected) ? selected : exercises[0] ?? "";

  const data = useMemo(() => {
    if (!current) return [];
    return [...sessions]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((s) => {
        const ex = s.exercices.find((e) => e.nom === current);
        if (!ex) return null;
        const maxPoids = ex.sets.reduce((m, set) => Math.max(m, set.poids), 0);
        const oneRm = Math.round(bestEstimated1RM(ex));
        return {
          label: format(parseISO(s.date), "dd/MM"),
          poids: maxPoids,
          rm: oneRm,
        };
      })
      .filter(Boolean) as { label: string; poids: number; rm: number }[];
  }, [sessions, current]);

  const cues = current ? cuesFor(current) : [];
  const objectif = current ? objectiveFor(current) : undefined;

  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between mb-3">
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
        <div className="h-full flex items-center justify-center text-text-dim text-sm">
          Pas encore de données pour cet exercice.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
            <XAxis dataKey="label" stroke="#a89d93" fontSize={11} />
            <YAxis stroke="#a89d93" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e7ded0",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="poids"
              name="Charge max (kg)"
              stroke="#7ab29b"
              strokeWidth={2}
              dot={{ fill: "#7ab29b", r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="rm"
              name="1RM estimé (kg)"
              stroke="#c9a6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      </div>
    </div>
  );
}
