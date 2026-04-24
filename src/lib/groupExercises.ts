import type { ExerciseEntry } from "../types";

export function groupExercises(exercices: ExerciseEntry[]): ExerciseEntry[] {
  const map = new Map<string, ExerciseEntry>();
  for (const ex of exercices) {
    const existing = map.get(ex.nom);
    if (existing) {
      existing.sets = [...existing.sets, ...ex.sets];
      if (ex.cardio) existing.cardio = ex.cardio;
      if (ex.durationMinutes) {
        existing.durationMinutes = (existing.durationMinutes ?? 0) + ex.durationMinutes;
        if (ex.intensity) existing.intensity = ex.intensity;
      }
      if (ex.comment && !existing.comment) existing.comment = ex.comment;
    } else {
      map.set(ex.nom, { ...ex, sets: [...ex.sets] });
    }
  }
  return Array.from(map.values());
}
