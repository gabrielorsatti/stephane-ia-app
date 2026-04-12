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

interface Props {
  entries: BodyWeightEntry[];
  onAdd: (entry: BodyWeightEntry) => void;
}

// Courbe d'évolution du poids de corps + input rapide.
export function BodyWeightChart({ entries, onAdd }: Props) {
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

  return (
    <div className="card h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Poids de corps</h3>
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
      </div>
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-dim text-sm">
          Ajoute ta première pesée
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7ded0" />
            <XAxis dataKey="label" stroke="#a89d93" fontSize={11} />
            <YAxis
              stroke="#a89d93"
              fontSize={11}
              domain={["dataMin - 2", "dataMax + 2"]}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e7ded0",
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="poids"
              stroke="#7ab29b"
              strokeWidth={2}
              dot={{ fill: "#7ab29b", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
