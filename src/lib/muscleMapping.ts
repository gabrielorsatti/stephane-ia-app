import type { Category, Session } from "../types";

export type MuscleGroup =
  | "chest"
  | "shoulders"
  | "triceps"
  | "biceps"
  | "forearms"
  | "upperBack"
  | "lats"
  | "lowerBack"
  | "core"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

export const ALL_MUSCLES: MuscleGroup[] = [
  "chest", "shoulders", "triceps", "biceps", "forearms",
  "upperBack", "lats", "lowerBack", "core",
  "glutes", "quads", "hamstrings", "calves",
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "Pectoraux",
  shoulders: "Épaules",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Avant-bras",
  upperBack: "Haut du dos",
  lats: "Dorsaux",
  lowerBack: "Lombaires",
  core: "Abdos",
  glutes: "Fessiers",
  quads: "Quadriceps",
  hamstrings: "Ischio-jambiers",
  calves: "Mollets",
};

type MuscleWeights = Partial<Record<MuscleGroup, number>>;

const CATEGORY_MUSCLES: Record<Category, MuscleWeights> = {
  Poussée:          { chest: 1, shoulders: 0.6, triceps: 0.8 },
  Tirage:           { upperBack: 0.8, lats: 1, biceps: 0.7, forearms: 0.4, lowerBack: 0.3 },
  Jambes:           { quads: 1, hamstrings: 0.8, glutes: 0.9, calves: 0.4 },
  Épaules:          { shoulders: 1, triceps: 0.3, upperBack: 0.3 },
  Bras:             { biceps: 1, triceps: 1, forearms: 0.6 },
  Abdos:            { core: 1 },
  Pliométrie:       { quads: 0.9, hamstrings: 0.7, glutes: 0.8, calves: 1, core: 0.3 },
  "Power Training": { quads: 0.8, hamstrings: 0.6, glutes: 0.7, shoulders: 0.7, upperBack: 0.6, lats: 0.4, core: 0.6, lowerBack: 0.5 },
  Cardio:           { quads: 0.8, hamstrings: 0.7, calves: 0.8, glutes: 0.6, core: 0.3 },
  "Cours Collectif":{ quads: 0.5, hamstrings: 0.4, glutes: 0.5, core: 0.4, shoulders: 0.3, calves: 0.3 },
  Mobilité:         { core: 0.2, hamstrings: 0.2, shoulders: 0.2 },
  Autre:            {},
};

const EXERCISE_OVERRIDES: Record<string, MuscleWeights> = {
  "Course":              { quads: 0.9, hamstrings: 0.8, calves: 1, glutes: 0.7, core: 0.3 },
  "Tapis de course":     { quads: 0.9, hamstrings: 0.8, calves: 1, glutes: 0.7, core: 0.3 },
  "Sprint":              { quads: 1, hamstrings: 1, calves: 0.9, glutes: 0.9, core: 0.4 },
  "Marche inclinée":     { quads: 0.8, hamstrings: 0.6, calves: 0.7, glutes: 0.9, core: 0.3 },
  "Stairmaster":         { quads: 0.9, hamstrings: 0.5, calves: 0.8, glutes: 1, core: 0.3 },
  "Vélo":                { quads: 1, hamstrings: 0.6, calves: 0.5, glutes: 0.5 },
  "Vélo elliptique":     { quads: 0.7, hamstrings: 0.6, calves: 0.4, glutes: 0.5, shoulders: 0.3, chest: 0.2, lats: 0.3 },
  "Assault Bike":        { quads: 0.8, hamstrings: 0.6, calves: 0.4, shoulders: 0.5, biceps: 0.3, triceps: 0.3, core: 0.4 },
  "Rameur":              { lats: 0.9, upperBack: 0.8, biceps: 0.6, quads: 0.7, hamstrings: 0.5, core: 0.5, shoulders: 0.4, forearms: 0.3 },
  "Ski erg":             { lats: 0.8, shoulders: 0.6, triceps: 0.7, core: 0.7, biceps: 0.3 },
  "Corde à sauter":      { calves: 1, quads: 0.5, hamstrings: 0.3, shoulders: 0.3, forearms: 0.3, core: 0.3 },
  "Burpees":             { chest: 0.5, shoulders: 0.5, triceps: 0.4, quads: 0.7, glutes: 0.5, core: 0.6, calves: 0.4 },
  "RPM":                 { quads: 1, hamstrings: 0.6, calves: 0.5, glutes: 0.6, core: 0.3 },
  "Aquabike":            { quads: 0.9, hamstrings: 0.6, calves: 0.5, glutes: 0.5, core: 0.3 },
  "Step":                { quads: 0.8, hamstrings: 0.5, calves: 0.6, glutes: 0.7, core: 0.3 },
  "BodyPump":            { chest: 0.5, shoulders: 0.5, biceps: 0.5, triceps: 0.5, quads: 0.6, glutes: 0.5, core: 0.4, lats: 0.4 },
  "CAF":                 { quads: 0.9, hamstrings: 0.7, glutes: 1, core: 0.8 },
  "HIIT Modéré":         { quads: 0.6, hamstrings: 0.5, glutes: 0.5, core: 0.5, shoulders: 0.3, chest: 0.3 },
  "Pilates":             { core: 1, glutes: 0.6, hamstrings: 0.4, shoulders: 0.3 },
  "Aquagym":             { quads: 0.4, hamstrings: 0.3, glutes: 0.4, shoulders: 0.4, core: 0.4 },
  "Hip thrust":          { glutes: 1, hamstrings: 0.6, quads: 0.3, core: 0.3, lowerBack: 0.2 },
  "Soulevé de terre":    { hamstrings: 0.9, glutes: 0.9, lowerBack: 1, lats: 0.5, upperBack: 0.6, forearms: 0.7, quads: 0.4 },
  "Soulevé de terre sumo": { hamstrings: 0.7, glutes: 1, lowerBack: 0.8, quads: 0.6, forearms: 0.6, upperBack: 0.5 },
  "Good morning":        { hamstrings: 1, glutes: 0.8, lowerBack: 0.9 },
  "Squat":               { quads: 1, glutes: 0.9, hamstrings: 0.5, core: 0.5, lowerBack: 0.4 },
  "Front squat":         { quads: 1, glutes: 0.7, core: 0.7, upperBack: 0.4 },
  "Dips":                { chest: 0.7, triceps: 1, shoulders: 0.5 },
  "Dips lestés":         { chest: 0.7, triceps: 1, shoulders: 0.5 },
  "Tractions":           { lats: 1, biceps: 0.7, upperBack: 0.6, forearms: 0.5, core: 0.3 },
  "Tractions lestées":   { lats: 1, biceps: 0.7, upperBack: 0.7, forearms: 0.5, core: 0.3 },
  "Rowing barre":        { lats: 0.8, upperBack: 1, biceps: 0.6, lowerBack: 0.5, forearms: 0.4 },
  "Épaulé-jeté":         { quads: 0.8, glutes: 0.7, shoulders: 0.9, triceps: 0.5, upperBack: 0.7, core: 0.7, hamstrings: 0.5 },
  "Arraché":             { quads: 0.7, glutes: 0.7, shoulders: 0.8, upperBack: 0.8, hamstrings: 0.6, core: 0.6, lowerBack: 0.5 },
};

const INTENSITY_FACTOR: Record<string, number> = {
  "léger": 0.6,
  "modéré": 1.0,
  "intense": 1.5,
};

export type IntensityLevel = 0 | 1 | 2 | 3;

export function intensityLevel(ratio: number): IntensityLevel {
  if (ratio < 0.05) return 0;
  if (ratio < 0.35) return 1;
  if (ratio < 0.7) return 2;
  return 3;
}

export interface MuscleHeatData {
  scores: Record<MuscleGroup, number>;
  maxScore: number;
}

function emptyScores(): Record<MuscleGroup, number> {
  return {
    chest: 0, shoulders: 0, triceps: 0, biceps: 0, forearms: 0,
    upperBack: 0, lats: 0, lowerBack: 0, core: 0,
    glutes: 0, quads: 0, hamstrings: 0, calves: 0,
  };
}

export function computeMuscleHeat(sessions: Session[], days = 7): MuscleHeatData {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const scores = emptyScores();

  for (const session of sessions) {
    if (session.date < cutoffStr) continue;
    for (const ex of session.exercices) {
      const mapping = EXERCISE_OVERRIDES[ex.nom] ?? CATEGORY_MUSCLES[ex.categorie];
      if (!mapping || Object.keys(mapping).length === 0) continue;

      let effort: number;
      if (ex.sets.length > 0) {
        effort = ex.sets.reduce((s, set) => s + set.reps * Math.max(set.poids, 1), 0);
      } else {
        const duration = ex.durationMinutes ?? ex.cardio?.duree ?? 0;
        const factor = INTENSITY_FACTOR[ex.intensity ?? "modéré"] ?? 1;
        effort = duration > 0 ? duration * 10 * factor : 300;
      }

      for (const [muscle, weight] of Object.entries(mapping)) {
        scores[muscle as MuscleGroup] += effort * (weight as number);
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores), 1);
  return { scores, maxScore };
}
