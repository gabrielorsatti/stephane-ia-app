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
                <stop offset="0%" stopColor="#7ab29b" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7ab29b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
            <XAxis dataKey="label" stroke="#a89d93" fontSize={11} />
            <YAxis stroke="#a89d93" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e7ded0",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#7a6e66" }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#7ab29b"
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
