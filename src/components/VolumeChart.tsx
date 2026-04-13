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
import { sessionVolume } from "../lib/scoring";
import { format, parseISO } from "date-fns";

interface Props {
  sessions: Session[];
}

// Courbe de volume total par séance dans le temps.
export function VolumeChart({ sessions }: Props) {
  const data = [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => ({
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
                <stop offset="0%" stopColor="#4f8570" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#4f8570" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#cfc1a6" />
            <XAxis dataKey="label" stroke="#8c7d71" fontSize={11} />
            <YAxis stroke="#8c7d71" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#f6efe2",
                border: "1px solid #cfc1a6",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#66584f" }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#4f8570"
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
