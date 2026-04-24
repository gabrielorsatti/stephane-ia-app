import type { ExerciseEntry } from "../types";
import { computePace, formatPace } from "./cardio";

export function formatExerciseStats(ex: ExerciseEntry): string {
  const parts: string[] = [];

  if (ex.cardio) {
    const { distance, duree, denivele } = ex.cardio;
    if (distance) parts.push(`${distance} km`);
    if (duree) parts.push(`${duree} min`);
    const pace = computePace(ex.cardio);
    if (pace) parts.push(`${formatPace(pace)} /km`);
    if (denivele) parts.push(`${denivele} m D+`);
    if (ex.intensity) parts.push(ex.intensity);
    if (parts.length > 0) return parts.join(" · ");
  }

  if (ex.durationMinutes) {
    parts.push(`${ex.durationMinutes} min`);
    if (ex.intensity) parts.push(ex.intensity);
    return parts.join(" · ");
  }

  if (ex.sets.length > 0) {
    return ex.sets.map((s) => `${s.reps}×${s.poids || "PDC"}`).join(" · ");
  }

  return "—";
}
