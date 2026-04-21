import type { Session } from "../types";
import { estimate1RM } from "./scoring";

export interface PRAlert {
  exerciseName: string;
  type: "maxPoids" | "best1RM";
  oldValue: number;
  newValue: number;
}

export function detectNewPRs(
  newSession: Session,
  previousSessions: Session[],
): PRAlert[] {
  const oldBests = new Map<string, { maxPoids: number; best1RM: number }>();

  for (const s of previousSessions) {
    if (s.id === newSession.id) continue;
    for (const ex of s.exercices) {
      const key = ex.nom;
      const prev = oldBests.get(key) ?? { maxPoids: 0, best1RM: 0 };
      for (const set of ex.sets) {
        if (set.poids > prev.maxPoids) prev.maxPoids = set.poids;
        const rm = estimate1RM(set);
        if (rm > prev.best1RM) prev.best1RM = rm;
      }
      oldBests.set(key, prev);
    }
  }

  const alerts: PRAlert[] = [];

  for (const ex of newSession.exercices) {
    if (ex.durationMinutes) continue;
    const prev = oldBests.get(ex.nom);
    if (!prev) continue;

    let sessionMaxPoids = 0;
    let sessionBest1RM = 0;
    for (const set of ex.sets) {
      if (set.poids > sessionMaxPoids) sessionMaxPoids = set.poids;
      const rm = estimate1RM(set);
      if (rm > sessionBest1RM) sessionBest1RM = rm;
    }

    if (sessionMaxPoids > prev.maxPoids && prev.maxPoids > 0) {
      alerts.push({
        exerciseName: ex.nom,
        type: "maxPoids",
        oldValue: prev.maxPoids,
        newValue: sessionMaxPoids,
      });
    } else if (sessionBest1RM > prev.best1RM * 1.02 && prev.best1RM > 0) {
      alerts.push({
        exerciseName: ex.nom,
        type: "best1RM",
        oldValue: Math.round(prev.best1RM),
        newValue: Math.round(sessionBest1RM),
      });
    }
  }

  return alerts;
}
