import type { ExerciseEntry, Session } from "../types";

export interface ExerciseDelta {
  lastDate: string;
  volumePct: number;
  maxWeightDiff: number;
  repsDiff: number;
  hasWeight: boolean;
}

export function compareWithLast(
  current: ExerciseEntry,
  sortedSessions: Session[],
): ExerciseDelta | null {
  if (current.sets.length === 0) return null;

  for (const session of sortedSessions) {
    const prev = session.exercices.find(
      (ex) => ex.nom === current.nom && ex.sets.length > 0,
    );
    if (!prev) continue;

    const currVol = current.sets.reduce((s, set) => s + set.reps * Math.max(set.poids, 1), 0);
    const prevVol = prev.sets.reduce((s, set) => s + set.reps * Math.max(set.poids, 1), 0);
    const currMax = Math.max(...current.sets.map((s) => s.poids));
    const prevMax = Math.max(...prev.sets.map((s) => s.poids));
    const currReps = current.sets.reduce((s, set) => s + set.reps, 0);
    const prevReps = prev.sets.reduce((s, set) => s + set.reps, 0);

    return {
      lastDate: session.date,
      volumePct: prevVol > 0 ? ((currVol - prevVol) / prevVol) * 100 : 0,
      maxWeightDiff: currMax - prevMax,
      repsDiff: currReps - prevReps,
      hasWeight: currMax > 0 || prevMax > 0,
    };
  }

  return null;
}
