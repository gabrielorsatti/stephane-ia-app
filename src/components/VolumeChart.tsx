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
import { useChartColors } from "../hooks/useChartColors";

interface Props {
  sessions: Session[];
  compact?: boolean;
}

export function VolumeChart({ sessions, compact }: Props) {
  const c = useChartColors();
  const data = mergeSessionsByDate(sessions).map((s) => ({
    date: s.date,
    label: format(parseISO(s.date), "dd/MM"),
    volume: Math.round(sessionVolume(s)),
  }));

  return (
    <div className={`card ${compact ? "h-[200px]" : "h-[320px]"}`}>
      <h3 className="text-sm font-semibold mb-3">Évolution du volume</h3>
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.c1} stopOpacity={0.6} />
                <stop offset="100%" stopColor={c.c1} stopOpacity={0} />
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
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke={c.c1}
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
