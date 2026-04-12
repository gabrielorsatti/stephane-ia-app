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

  return (
    <div className="card h-[360px] flex flex-col">
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
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-dim text-sm">
          Pas encore de données pour cet exercice.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#26262b" />
            <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#17171a",
                border: "1px solid #26262b",
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="poids"
              name="Charge max (kg)"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ fill: "#f97316", r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="rm"
              name="1RM estimé (kg)"
              stroke="#a1a1aa"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
