import { Bot, Brain, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "../types";
import { buildProgressionSummary, type ProgressionSummary } from "../lib/progressionSummary";
import { generateCoachBilan } from "../lib/sessionCommentary";

const LS_KEY = "gym-track:coach-bilan";
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedBilan {
  text: string;
  generatedAt: string;
  sessionCount: number;
}

function loadCache(): CachedBilan | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedBilan;
    const age = Date.now() - new Date(parsed.generatedAt).getTime();
    if (age > CACHE_DURATION_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(bilan: CachedBilan) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(bilan));
  } catch { /* noop */ }
}

interface Props {
  sessions: Session[];
  userId?: string;
}

export function CoachBilan({ sessions, userId }: Props) {
  const [bilan, setBilan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProgressionSummary | null>(null);

  const sessionCount = useMemo(
    () => sessions.filter((s) => s.date >= new Date(Date.now() - 12 * 7 * 86400000).toISOString().slice(0, 10)).length,
    [sessions],
  );

  useEffect(() => {
    const s = buildProgressionSummary(sessions, 12);
    setSummary(s);

    const cached = loadCache();
    if (cached && cached.sessionCount === sessionCount) {
      setBilan(cached.text);
    }
  }, [sessions, sessionCount]);

  const generate = useCallback(async () => {
    if (!summary || summary.totalSessions < 3) return;
    setLoading(true);
    try {
      const text = await generateCoachBilan(summary.textSummary, userId);
      if (text) {
        setBilan(text);
        saveCache({ text, generatedAt: new Date().toISOString(), sessionCount });
      }
    } finally {
      setLoading(false);
    }
  }, [summary, userId, sessionCount]);

  if (!summary || summary.totalSessions < 3) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold">Le mot du Coach</h3>
        </div>
        <p className="text-xs text-text-muted">
          Stéphane a besoin d'au moins 3 séances sur les 12 dernières semaines pour rédiger un bilan.
        </p>
      </div>
    );
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-semibold">Le mot du Coach</h3>
          <span className="chip bg-accent-muted/40 text-accent-soft text-xs">
            12 semaines
          </span>
        </div>
        <button
          onClick={() => void generate()}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-bg-elev text-text-muted transition-colors disabled:opacity-40"
          aria-label="Générer le bilan"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats compactes */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat
          label="Séances"
          value={`${summary.totalSessions}`}
          sub={`${summary.avgSessionsPerWeek}/sem`}
        />
        <MiniStat
          label="Volume moy."
          value={`${Math.round(summary.avgWeekVolume)} kg`}
          sub="/semaine"
        />
        <MiniStat
          label="Tendance"
          value={`${summary.volumeTrendPercent > 0 ? "+" : ""}${summary.volumeTrendPercent}%`}
          sub="volume"
          accent={summary.volumeTrendPercent > 0 ? "up" : summary.volumeTrendPercent < 0 ? "down" : undefined}
        />
      </div>

      {/* Top progressions */}
      {summary.topProgressions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-text-muted font-medium">Top progressions</div>
          {summary.topProgressions.map((p) => (
            <div key={p.nom} className="flex items-center justify-between bg-bg-soft border border-border rounded-lg px-3 py-1.5">
              <span className="text-xs font-medium truncate">{p.nom}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-text-dim font-mono">{p.oldMax}→{p.newMax} kg</span>
                <span className="text-xs font-bold text-green-500">+{p.deltaPercent}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bilan texte */}
      {bilan ? (
        <div className="bg-accent-muted/20 border border-accent-muted rounded-xl px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-accent-soft text-xs font-semibold uppercase tracking-wide">
            <Bot className="w-3.5 h-3.5" />
            Bilan de Stéphane
          </div>
          <div className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
            {bilan}
          </div>
        </div>
      ) : (
        <button
          onClick={() => void generate()}
          disabled={loading}
          className="w-full btn-ghost text-sm"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Stéphane analyse tes données…
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              Demander le bilan à Stéphane
            </>
          )}
        </button>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub, accent }: {
  label: string;
  value: string;
  sub: string;
  accent?: "up" | "down";
}) {
  return (
    <div className="bg-bg-soft border border-border rounded-xl px-2.5 py-2 text-center">
      <div className="text-xs text-text-dim">{label}</div>
      <div className="flex items-center justify-center gap-1 mt-0.5">
        {accent === "up" && <TrendingUp className="w-3 h-3 text-green-500" />}
        {accent === "down" && <TrendingDown className="w-3 h-3 text-rose-400" />}
        <span className={`text-sm font-bold ${accent === "up" ? "text-green-500" : accent === "down" ? "text-rose-400" : ""}`}>
          {value}
        </span>
      </div>
      <div className="text-xs text-text-dim">{sub}</div>
    </div>
  );
}
