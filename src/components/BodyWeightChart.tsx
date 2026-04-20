import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { BodyWeightEntry } from "../types";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useChartColors } from "../hooks/useChartColors";

interface Props {
  entries: BodyWeightEntry[];
  onAdd: (entry: BodyWeightEntry) => void;
  compact?: boolean;
}

export function BodyWeightChart({ entries, onAdd, compact }: Props) {
  const [poids, setPoids] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const data = entries.map((e) => ({
    ...e,
    label: format(parseISO(e.date), "dd/MM"),
  }));

  function submit() {
    const n = parseFloat(poids.replace(",", "."));
    if (!isNaN(n) && n > 0) {
      onAdd({ date, poids: n });
      setPoids("");
    }
  }

  const c = useChartColors();

  return (
    <div className={`card ${compact ? "h-[200px]" : "h-[320px]"} flex flex-col`}>
      <div className={`flex items-center justify-between ${compact ? "mb-2" : "mb-3"} gap-2 flex-wrap`}>
        <h3 className="text-sm font-semibold">Poids de corps</h3>
        {!compact && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input !py-1 !px-2 text-xs w-36"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              className="input !py-1 !px-2 text-xs w-20"
              placeholder="kg"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              inputMode="decimal"
            />
            <button className="btn-primary !py-1 !px-2" onClick={submit}>
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-dim text-sm">
          Ajoute ta première pesée
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
            <XAxis dataKey="label" stroke={c.axis} fontSize={11} />
            <YAxis
              stroke={c.axis}
              fontSize={11}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: c.textMuted }}
            />
            <Line
              type="monotone"
              dataKey="poids"
              stroke={c.c1}
              strokeWidth={2}
              dot={{ fill: c.c1, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
