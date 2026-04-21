import type { Session } from "../types";
import { buildProgressionSummary } from "./progressionSummary";

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
}

function mondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function generateWeeklyChallenge(sessions: Session[]): WeeklyChallenge {
  const summary = buildProgressionSummary(sessions, 4);
  const monday = mondayOfWeek(new Date());
  const thisWeekSessions = sessions.filter((s) => s.date >= monday);

  const thisWeekMinutes = thisWeekSessions.reduce(
    (sum, s) => sum + s.exercices.reduce((m, ex) => m + (ex.durationMinutes ?? 0), 0),
    0,
  );

  const thisWeekVolume = summary.currentWeekVolume;

  const weakCat = summary.categoryFrequencies.length > 1
    ? summary.categoryFrequencies[summary.categoryFrequencies.length - 1]
    : null;

  const challenges: Array<() => WeeklyChallenge> = [
    () => {
      const target = Math.max(Math.round(summary.avgSessionsPerWeek + 1), 3);
      return {
        id: "sessions",
        title: "Fréquence +1",
        description: `Stéphane te défie de faire ${target} séances cette semaine.`,
        target,
        current: thisWeekSessions.length,
        unit: "séances",
      };
    },
    () => {
      const target = Math.round((summary.avgWeekVolume * 1.1) / 100) * 100 || 5000;
      return {
        id: "volume",
        title: "Volume record",
        description: `Dépasse ${target.toLocaleString("fr-FR")} kg de volume total cette semaine.`,
        target,
        current: Math.round(thisWeekVolume),
        unit: "kg",
      };
    },
    () => ({
      id: "minutes",
      title: "150 minutes actives",
      description: "L'OMS recommande 150 min d'activité par semaine. Relève le défi !",
      target: 150,
      current: thisWeekMinutes,
      unit: "min",
    }),
  ];

  if (weakCat && weakCat.avgPerWeek < 1) {
    challenges.push(() => ({
      id: "weak-cat",
      title: `Focus ${weakCat.categorie}`,
      description: `Stéphane remarque que tu négliges ${weakCat.categorie}. Une séance dédiée cette semaine ?`,
      target: 1,
      current: thisWeekSessions.filter((s) =>
        s.exercices.some((e) => e.categorie === weakCat.categorie),
      ).length,
      unit: "séance",
    }));
  }

  const weekNum = Math.floor(
    (new Date(monday + "T00:00:00").getTime() / 86400000) % challenges.length,
  );
  return challenges[weekNum % challenges.length]();
}
