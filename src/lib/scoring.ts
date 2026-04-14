import type { ExerciseEntry, Session, SetEntry } from "../types";
import { exerciseType } from "./exercises";

// Charge effective d'une série. Pour un exercice bodyweight, c'est (PDC + lest);
// pour un exercice strength, c'est simplement `poids`. Sans PDC fourni, on
// retombe sur `poids` seul (comportement avant le module PDC).
export function effectiveLoad(
  set: SetEntry,
  opts: { bodyweight?: boolean; userWeight?: number } = {},
): number {
  if (opts.bodyweight && opts.userWeight && opts.userWeight > 0) {
    return opts.userWeight + (set.poids || 0);
  }
  return set.poids || 0;
}

// Volume d'une série : reps × charge effective.
export function setVolume(
  set: SetEntry,
  opts: { bodyweight?: boolean; userWeight?: number } = {},
): number {
  return set.reps * effectiveLoad(set, opts);
}

// Volume d'un exercice : somme des séries + éventuel volume cardio converti
// (ici laissé à 0 — le cardio a ses propres métriques, voir lib/cardio.ts).
export function exerciseVolume(
  ex: ExerciseEntry,
  userWeight?: number,
): number {
  const bodyweight = exerciseType(ex.nom) === "bodyweight";
  return ex.sets.reduce(
    (acc, s) => acc + setVolume(s, { bodyweight, userWeight }),
    0,
  );
}

// Volume total d'une séance (kg). Utilise session.bodyWeight s'il est renseigné
// pour pondérer correctement les exercices au poids du corps.
export function sessionVolume(session: Session): number {
  return session.exercices.reduce(
    (acc, ex) => acc + exerciseVolume(ex, session.bodyWeight),
    0,
  );
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
    const bodyweight = exerciseType(ex.nom) === "bodyweight";
    for (const s of ex.sets) {
      const v = setVolume(s, { bodyweight, userWeight: session.bodyWeight });
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

// ─── Helpers dédiés à la vue "Progression par exercice" ──────────────────
// Ces fonctions opèrent sur un ExerciseEntry isolé et servent à dériver les
// 3 métriques du graphique de progression (volume / intensité travail / PR).

// Volume total d'un exercice sur une séance : somme des poids × reps.
export function volumeForExercise(
  ex: ExerciseEntry,
  userWeight?: number,
): number {
  return exerciseVolume(ex, userWeight);
}

// Poids max soulevé sur les séries dont le nombre de reps est dans [min, max]
// (bornes incluses). Utile pour isoler la charge de travail hypertrophique
// (6-12 reps par défaut) indépendamment des séries lourdes ou échauffement.
export function maxPoidsInRepRange(
  ex: ExerciseEntry,
  min: number,
  max: number,
): number {
  let best = 0;
  for (const s of ex.sets) {
    if (s.reps >= min && s.reps <= max && s.poids > best) best = s.poids;
  }
  return best;
}

// Record absolu : poids max soulevé, toutes reps confondues.
export function maxPoidsAbsolute(ex: ExerciseEntry): number {
  let best = 0;
  for (const s of ex.sets) if (s.poids > best) best = s.poids;
  return best;
}

// Construit la série temporelle d'un exercice sur l'historique des séances,
// avec les 3 métriques. Les séances sans l'exercice ou sans donnée utile
// pour la métrique retournent null sur ce point (filtré côté affichage).
export interface ExerciseProgressionPoint {
  date: string;
  label: string;
  volume: number;
  intensity: number; // charge max sur séries [minReps, maxReps]
  pr: number;        // charge max absolue
}

export function buildExerciseProgression(
  sessions: Session[],
  exerciseName: string,
  opts: { minReps?: number; maxReps?: number } = {},
): ExerciseProgressionPoint[] {
  const minReps = opts.minReps ?? 6;
  const maxReps = opts.maxReps ?? 12;
  const points: ExerciseProgressionPoint[] = [];
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const s of sorted) {
    const ex = s.exercices.find((e) => e.nom === exerciseName);
    if (!ex) continue;
    points.push({
      date: s.date,
      label: s.date.slice(5).replace("-", "/"), // mm/dd
      volume: volumeForExercise(ex, s.bodyWeight),
      intensity: maxPoidsInRepRange(ex, minReps, maxReps),
      pr: maxPoidsAbsolute(ex),
    });
  }
  return points;
}

// Agrège le volume par catégorie pour une liste de séances.
export function volumeByCategory(
  sessions: Session[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    for (const ex of s.exercices) {
      map[ex.categorie] =
        (map[ex.categorie] ?? 0) + exerciseVolume(ex, s.bodyWeight);
    }
  }
  return map;
}
