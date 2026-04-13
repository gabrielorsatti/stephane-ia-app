import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { volumeByCategory } from "../lib/scoring";
import type { Session } from "../types";

interface Props {
  sessions: Session[];
}

// Volume par catégorie musculaire (barres).
export function CategoryChart({ sessions }: Props) {
  const map = volumeByCategory(sessions);
  const data = Object.entries(map)
    .map(([categorie, volume]) => ({ categorie, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);

  return (
    <div className="card h-[320px]">
      <h3 className="text-sm font-semibold mb-3">Volume par catégorie</h3>
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-text-dim text-sm">
          Aucune donnée
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#cfc1a6" />
            <XAxis dataKey="categorie" stroke="#8c7d71" fontSize={11} />
            <YAxis stroke="#8c7d71" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "#f6efe2",
                border: "1px solid #cfc1a6",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="volume" fill="#4f8570" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
