import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Session } from "../types";
import { mergeSessionsByDate, sessionVolume } from "../lib/scoring";
import { format, parseISO } from "date-fns";

interface Props {
  sessions: Session[];
}

// Courbe de volume total par jour calendaire. Les saisies multiples le même
// jour sont agrégées en un seul point.
export function VolumeChart({ sessions }: Props) {
  const data = mergeSessionsByDate(sessions).map((s) => ({
    date: s.date,
    label: format(parseISO(s.date), "dd/MM"),
    volume: Math.round(sessionVolume(s)),
  }));

  return (
    <div className="card h-[320px]">
      <h3 className="text-sm font-semibold mb-3">Évolution du volume</h3>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a7e8c9" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#a7e8c9" stopOpacity={0} />
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
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#a7e8c9"
              strokeWidth={2}
              fill="url(#volGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center text-text-dim text-sm">
      Pas encore de données. Enregistre ta première séance !
    </div>
  );
}
