import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info, Loader2, Plus, Sparkles, Trash2, Utensils } from "lucide-react";
import { useMemo, useState } from "react";
import type { NutritionLog } from "../types";
import { parseNutritionWithAI } from "../lib/nutritionParser";
import { useChartColors } from "../hooks/useChartColors";
import { useNutritionLogs } from "../hooks/useNutritionLogs";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function sumMacros(logs: NutritionLog[]) {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein,
      carbs: acc.carbs + l.carbs,
      fat: acc.fat + l.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// Construit l'array des 14 derniers jours (incluant aujourd'hui), chaque
// entrée agrégeant les macros de tous les logs de ce jour-là.
function last14Days(logs: NutritionLog[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: Array<{
    date: string;
    label: string;
    calories: number;
    protein: number;
  }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter((l) => l.date === iso);
    const s = sumMacros(dayLogs);
    out.push({
      date: iso,
      label: iso.slice(5).replace("-", "/"),
      calories: Math.round(s.calories),
      protein: Math.round(s.protein),
    });
  }
  return out;
}

export function NutritionView() {
  const { logs, addLog, removeLog } = useNutritionLogs();
  const c = useChartColors();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [manualMacros, setManualMacros] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const today = todayISO();
  const todayLogs = useMemo(
    () => logs.filter((l) => l.date === today),
    [logs, today],
  );
  const totals = useMemo(() => sumMacros(todayLogs), [todayLogs]);
  const chartData = useMemo(() => last14Days(logs), [logs]);

  async function handleAi() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const macros = await parseNutritionWithAI(text);
      addLog({ date: today, foodText: text.trim(), ...macros });
      setText("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Impossible d'analyser. Essaie la saisie manuelle.",
      );
      setManual(true);
    } finally {
      setLoading(false);
    }
  }

  function handleManual() {
    const cal = parseFloat(manualMacros.calories) || 0;
    const p = parseFloat(manualMacros.protein) || 0;
    const cb = parseFloat(manualMacros.carbs) || 0;
    const f = parseFloat(manualMacros.fat) || 0;
    if (!text.trim() && cal === 0 && p === 0 && cb === 0 && f === 0) return;
    addLog({
      date: today,
      foodText: text.trim() || "Saisie manuelle",
      calories: cal,
      protein: p,
      carbs: cb,
      fat: f,
    });
    setText("");
    setManualMacros({ calories: "", protein: "", carbs: "", fat: "" });
    setManual(false);
    setError(null);
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">Alimentation</h2>
        </div>

        <label className="text-xs text-text-muted mb-1 block">
          Qu'as-tu mangé ?
        </label>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ex: 150g de poulet, riz et brocolis"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleAi();
              }
            }}
            disabled={loading}
          />
          <button
            className="btn-primary shrink-0"
            onClick={() => void handleAi()}
            disabled={loading || !text.trim()}
            aria-label="Analyser avec l'IA"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Analyser</span>
          </button>
        </div>

        {error && (
          <div className="mt-2 text-xs text-accent-soft bg-accent-muted/20 border border-accent-muted/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          className="mt-2 text-xs text-text-muted hover:text-text underline"
          onClick={() => setManual((v) => !v)}
          type="button"
        >
          {manual ? "Fermer la saisie manuelle" : "Saisie manuelle (pas d'IA)"}
        </button>

        {manual && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["calories", "protein", "carbs", "fat"] as const).map((k) => (
              <label key={k} className="text-xs text-text-muted">
                <span className="block mb-1 capitalize">
                  {k === "calories"
                    ? "Calories"
                    : k === "protein"
                      ? "Protéines (g)"
                      : k === "carbs"
                        ? "Glucides (g)"
                        : "Lipides (g)"}
                </span>
                <input
                  className="input"
                  inputMode="decimal"
                  type="number"
                  min="0"
                  step="0.1"
                  value={manualMacros[k]}
                  onChange={(e) =>
                    setManualMacros({ ...manualMacros, [k]: e.target.value })
                  }
                />
              </label>
            ))}
            <button
              className="btn-primary col-span-2"
              onClick={handleManual}
              type="button"
            >
              <Plus className="w-4 h-4" />
              Ajouter au journal
            </button>
          </div>
        )}
      </div>

      <DailyDashboard totals={totals} />

      <div className="flex items-start gap-2 text-xs text-text-muted bg-bg-soft border border-border rounded-lg px-3 py-2">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-soft" />
        <span>
          Le suivi calorique est purement informatif. Il faut écouter son
          corps et privilégier son bien-être mental avant les chiffres.
          Gamberge.
        </span>
      </div>

      {todayLogs.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">
            Derniers ajouts ({todayLogs.length})
          </h3>
          <ul className="space-y-2">
            {[...todayLogs]
              .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
              .map((l) => (
                <li
                  key={l.id}
                  className="flex items-start gap-2 text-xs bg-bg-soft border border-border rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-text truncate">{l.foodText}</div>
                    <div className="text-text-dim mt-0.5">
                      {l.calories} kcal · {Math.round(l.protein)}P ·{" "}
                      {Math.round(l.carbs)}G · {Math.round(l.fat)}L
                    </div>
                  </div>
                  <button
                    className="text-text-dim hover:text-accent shrink-0 p-1"
                    onClick={() => removeLog(l.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card h-[280px]">
          <h3 className="text-sm font-semibold mb-3">
            Protéines — 14 derniers jours
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="label" stroke={c.axis} fontSize={10} />
              <YAxis stroke={c.axis} fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: c.textMuted }}
                formatter={(v: number) => [`${v} g`, "Protéines"]}
              />
              <Bar dataKey="protein" fill={c.c2} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card h-[280px]">
          <h3 className="text-sm font-semibold mb-3">
            Calories — 14 derniers jours
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="label" stroke={c.axis} fontSize={10} />
              <YAxis stroke={c.axis} fontSize={10} />
              <Tooltip
                contentStyle={{
                  background: c.bgCard,
                  border: `1px solid ${c.border}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: c.textMuted }}
                formatter={(v: number) => [`${v} kcal`, "Calories"]}
              />
              <Line
                type="monotone"
                dataKey="calories"
                stroke={c.c1}
                strokeWidth={2}
                dot={{ fill: c.c1, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DailyDashboard({
  totals,
}: {
  totals: { calories: number; protein: number; carbs: number; fat: number };
}) {
  const items: Array<{
    key: keyof typeof totals;
    label: string;
    unit: string;
    colorVar: string;
  }> = [
    { key: "calories", label: "Calories", unit: "kcal", colorVar: "--c-chart-1" },
    { key: "protein", label: "Protéines", unit: "g", colorVar: "--c-chart-2" },
    { key: "carbs", label: "Glucides", unit: "g", colorVar: "--c-chart-3" },
    { key: "fat", label: "Lipides", unit: "g", colorVar: "--c-accent" },
  ];
  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3">Aujourd'hui</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => {
          const value = Math.round(totals[it.key]);
          const color = `rgb(var(${it.colorVar}))`;
          return (
            <div
              key={it.key}
              className="bg-bg-soft border-l-4 border-y border-r border-border rounded-lg p-3"
              style={{ borderLeftColor: color }}
            >
              <div className="text-xs text-text-muted mb-1">{it.label}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold" style={{ color }}>
                  {value}
                </span>
                <span className="text-xs text-text-dim">{it.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
