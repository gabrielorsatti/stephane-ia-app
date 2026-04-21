import type { ExerciseEntry, Session } from "../types";
import { exerciseVolume, bestEstimated1RM } from "./scoring";

export interface WeekBucket {
  weekLabel: string;
  sessions: Session[];
  totalVolume: number;
  sessionCount: number;
}

export interface ExerciseProgDelta {
  nom: string;
  categorie: string;
  oldMax: number;
  newMax: number;
  deltaPercent: number;
}

export interface CategoryFrequency {
  categorie: string;
  totalSessions: number;
  avgPerWeek: number;
  volumeTrend: number;
}

export interface ProgressionSummary {
  weeks: number;
  totalSessions: number;
  avgSessionsPerWeek: number;
  volumeTrendPercent: number;
  categoryFrequencies: CategoryFrequency[];
  topProgressions: ExerciseProgDelta[];
  currentWeekVolume: number;
  avgWeekVolume: number;
  textSummary: string;
}

function weekKey(date: string): string {
  const d = new Date(date + "T00:00:00");
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function cutoffDate(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
  return d.toISOString().slice(0, 10);
}

function bucketByWeek(sessions: Session[]): WeekBucket[] {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    const k = weekKey(s.date);
    const arr = map.get(k) ?? [];
    arr.push(s);
    map.set(k, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekLabel, sess]) => ({
      weekLabel,
      sessions: sess,
      totalVolume: sess.reduce(
        (sum, s) =>
          sum + s.exercices.reduce((v, ex) => v + exerciseVolume(ex, s.bodyWeight), 0),
        0,
      ),
      sessionCount: sess.length,
    }));
}

function computeCategoryFrequencies(
  sessions: Session[],
  weekCount: number,
): CategoryFrequency[] {
  const catMap = new Map<string, { sessSet: Set<string>; volume: number[] }>();

  const byWeek = new Map<string, Map<string, number>>();

  for (const s of sessions) {
    const wk = weekKey(s.date);
    for (const ex of s.exercices) {
      const cat = ex.categorie;
      if (!catMap.has(cat)) catMap.set(cat, { sessSet: new Set(), volume: [] });
      const entry = catMap.get(cat)!;
      entry.sessSet.add(s.id);

      if (!byWeek.has(wk)) byWeek.set(wk, new Map());
      const weekMap = byWeek.get(wk)!;
      weekMap.set(cat, (weekMap.get(cat) ?? 0) + exerciseVolume(ex, s.bodyWeight));
    }
  }

  const weekKeys = Array.from(byWeek.keys()).sort();
  const halfIdx = Math.floor(weekKeys.length / 2);
  const firstHalf = weekKeys.slice(0, halfIdx);
  const secondHalf = weekKeys.slice(halfIdx);

  const result: CategoryFrequency[] = [];
  for (const [cat, { sessSet }] of catMap) {
    const volFirst = firstHalf.reduce((s, wk) => s + (byWeek.get(wk)?.get(cat) ?? 0), 0);
    const volSecond = secondHalf.reduce((s, wk) => s + (byWeek.get(wk)?.get(cat) ?? 0), 0);
    const trend = volFirst > 0 ? ((volSecond - volFirst) / volFirst) * 100 : 0;

    result.push({
      categorie: cat,
      totalSessions: sessSet.size,
      avgPerWeek: Math.round((sessSet.size / Math.max(weekCount, 1)) * 10) / 10,
      volumeTrend: Math.round(trend),
    });
  }

  return result.sort((a, b) => b.totalSessions - a.totalSessions);
}

function findTopProgressions(sessions: Session[], topN: number): ExerciseProgDelta[] {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const halfIdx = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, halfIdx);
  const secondHalf = sorted.slice(halfIdx);

  function maxByExercise(slice: Session[]): Map<string, { max: number; cat: string }> {
    const map = new Map<string, { max: number; cat: string }>();
    for (const s of slice) {
      for (const ex of s.exercices) {
        if (ex.durationMinutes) continue;
        const est = bestEstimated1RM(ex);
        if (est <= 0) continue;
        const prev = map.get(ex.nom);
        if (!prev || est > prev.max) {
          map.set(ex.nom, { max: est, cat: ex.categorie });
        }
      }
    }
    return map;
  }

  const oldMaxes = maxByExercise(firstHalf);
  const newMaxes = maxByExercise(secondHalf);

  const deltas: ExerciseProgDelta[] = [];
  for (const [nom, { max: newMax, cat }] of newMaxes) {
    const old = oldMaxes.get(nom);
    if (!old || old.max <= 0) continue;
    const delta = ((newMax - old.max) / old.max) * 100;
    if (delta > 0) {
      deltas.push({
        nom,
        categorie: cat,
        oldMax: Math.round(old.max),
        newMax: Math.round(newMax),
        deltaPercent: Math.round(delta),
      });
    }
  }

  return deltas.sort((a, b) => b.deltaPercent - a.deltaPercent).slice(0, topN);
}

function buildTextSummary(summary: Omit<ProgressionSummary, "textSummary">): string {
  const lines: string[] = [];

  lines.push(
    `${summary.totalSessions} séances en ${summary.weeks} semaines (moy. ${summary.avgSessionsPerWeek}/sem).`,
  );

  const volDir = summary.volumeTrendPercent > 0 ? "+" : "";
  lines.push(
    `Volume hebdo moy. ${Math.round(summary.avgWeekVolume)} kg (tendance ${volDir}${summary.volumeTrendPercent}%).`,
  );

  for (const cf of summary.categoryFrequencies.slice(0, 4)) {
    const trend = cf.volumeTrend > 0 ? `+${cf.volumeTrend}%` : `${cf.volumeTrend}%`;
    lines.push(`${cf.categorie}: ${cf.avgPerWeek} séances/sem, volume ${trend}.`);
  }

  if (summary.topProgressions.length > 0) {
    lines.push("Top progressions charge:");
    for (const p of summary.topProgressions) {
      lines.push(`  ${p.nom}: ${p.oldMax}→${p.newMax} kg (+${p.deltaPercent}%).`);
    }
  }

  return lines.join("\n");
}

export function buildProgressionSummary(
  sessions: Session[],
  weeks = 12,
): ProgressionSummary {
  const cutoff = cutoffDate(weeks);
  const filtered = sessions.filter((s) => s.date >= cutoff);

  const buckets = bucketByWeek(filtered);
  const weekCount = Math.max(buckets.length, 1);
  const totalSessions = filtered.length;
  const avgSessionsPerWeek = Math.round((totalSessions / Math.max(weeks, 1)) * 10) / 10;

  const volumes = buckets.map((b) => b.totalVolume);
  const avgWeekVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0;

  const halfIdx = Math.floor(volumes.length / 2);
  const firstHalfAvg =
    halfIdx > 0
      ? volumes.slice(0, halfIdx).reduce((a, b) => a + b, 0) / halfIdx
      : 0;
  const secondHalfAvg =
    volumes.length - halfIdx > 0
      ? volumes.slice(halfIdx).reduce((a, b) => a + b, 0) / (volumes.length - halfIdx)
      : 0;
  const volumeTrendPercent =
    firstHalfAvg > 0
      ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
      : 0;

  const currentWeekVolume = buckets.length > 0 ? buckets[buckets.length - 1].totalVolume : 0;

  const categoryFrequencies = computeCategoryFrequencies(filtered, weekCount);
  const topProgressions = findTopProgressions(filtered, 3);

  const partial = {
    weeks,
    totalSessions,
    avgSessionsPerWeek,
    volumeTrendPercent,
    categoryFrequencies,
    topProgressions,
    currentWeekVolume,
    avgWeekVolume,
  };

  return {
    ...partial,
    textSummary: buildTextSummary(partial),
  };
}
