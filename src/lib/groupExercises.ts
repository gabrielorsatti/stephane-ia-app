import type { ExerciseEntry } from "../types";

export function groupExercises(exercices: ExerciseEntry[]): ExerciseEntry[] {
  const map = new Map<string, ExerciseEntry>();
  for (const ex of exercices) {
    const existing = map.get(ex.nom);
    if (existing) {
      existing.sets = [...existing.sets, ...ex.sets];
      if (ex.cardio) existing.cardio = ex.cardio;
    } else {
      map.set(ex.nom, { ...ex, sets: [...ex.sets] });
    }
  }
  return Array.from(map.values());
}
