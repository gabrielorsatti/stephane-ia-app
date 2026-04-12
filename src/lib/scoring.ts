import type { ExerciseEntry, Session, SetEntry } from "../types";

// Volume d'une série : reps × poids (kg). Si poids=0, on considère 1 unité par rep.
export function setVolume(set: SetEntry): number {
  return set.reps * (set.poids || 0);
}

// Volume d'un exercice : somme des séries.
export function exerciseVolume(ex: ExerciseEntry): number {
  return ex.sets.reduce((acc, s) => acc + setVolume(s), 0);
}

// Volume total d'une séance (kg).
export function sessionVolume(session: Session): number {
  return session.exercices.reduce((acc, ex) => acc + exerciseVolume(ex), 0);
}

// Formule d'Epley pour estimer le 1RM à partir d'une série donnée.
// 1RM = poids × (1 + reps / 30), plafonné à reps <= 20.
export function estimate1RM(set: SetEntry): number {
  if (set.poids <= 0 || set.reps <= 0) return 0;
  const reps = Math.min(set.reps, 20);
  return set.poids * (1 + reps / 30);
}

// Meilleure estimation de 1RM sur un exercice donné.
export function bestEstimated1RM(ex: ExerciseEntry): number {
  return ex.sets.reduce((best, s) => Math.max(best, estimate1RM(s)), 0);
}

// Score d'intensité : moyenne des estimations 1RM pondérées par le volume.
export function sessionIntensityScore(session: Session): number {
  let num = 0;
  let den = 0;
  for (const ex of session.exercices) {
    for (const s of ex.sets) {
      const v = setVolume(s);
      num += estimate1RM(s) * v;
      den += v;
    }
  }
  return den > 0 ? num / den : 0;
}

// Score global d'une séance : mélange volume + intensité (normalisé).
// Formule : (volume / 100) + (intensité 1RM moyenne / 2). Ajustable.
export function sessionScore(session: Session): number {
  const vol = sessionVolume(session);
  const intensity = sessionIntensityScore(session);
  return Math.round(vol / 100 + intensity / 2);
}

// Agrège le volume par catégorie pour une liste de séances.
export function volumeByCategory(
  sessions: Session[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    for (const ex of s.exercices) {
      map[ex.categorie] = (map[ex.categorie] ?? 0) + exerciseVolume(ex);
    }
  }
  return map;
}
