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

const CATEGORY_MUSCLES: Record<Category, Partial<Record<MuscleGroup, number>>> = {
  Poussée: { chest: 1, shoulders: 0.6, triceps: 0.7 },
  Tirage: { upperBack: 0.8, lats: 1, biceps: 0.7, forearms: 0.4, lowerBack: 0.3 },
  Jambes: { quads: 1, hamstrings: 0.8, glutes: 0.9, calves: 0.4 },
  Épaules: { shoulders: 1, triceps: 0.3, upperBack: 0.3 },
  Bras: { biceps: 1, triceps: 1, forearms: 0.6 },
  Abdos: { core: 1 },
  Pliométrie: { quads: 0.8, hamstrings: 0.6, glutes: 0.7, calves: 0.9, core: 0.3 },
  "Power Training": { quads: 0.7, hamstrings: 0.5, glutes: 0.6, shoulders: 0.6, upperBack: 0.5, lats: 0.4, core: 0.5 },
  Cardio: { quads: 0.3, hamstrings: 0.3, calves: 0.4, core: 0.2 },
  "Cours Collectif": { quads: 0.3, hamstrings: 0.2, glutes: 0.3, core: 0.3, shoulders: 0.2 },
  Mobilité: {},
  Autre: {},
};

export interface MuscleHeatData {
  scores: Record<MuscleGroup, number>;
  maxScore: number;
}

export function computeMuscleHeat(sessions: Session[], days = 7): MuscleHeatData {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const scores: Record<MuscleGroup, number> = {
    chest: 0, shoulders: 0, triceps: 0, biceps: 0, forearms: 0,
    upperBack: 0, lats: 0, lowerBack: 0, core: 0,
    glutes: 0, quads: 0, hamstrings: 0, calves: 0,
  };

  for (const session of sessions) {
    if (session.date < cutoffStr) continue;
    for (const ex of session.exercices) {
      const mapping = CATEGORY_MUSCLES[ex.categorie];
      if (!mapping) continue;
      const volume = ex.sets.reduce((s, set) => s + set.reps * Math.max(set.poids, 1), 0)
        + (ex.durationMinutes ?? 0) * 5;
      const weight = Math.max(1, Math.log10(volume + 1));
      for (const [muscle, factor] of Object.entries(mapping)) {
        scores[muscle as MuscleGroup] += weight * (factor as number);
      }
    }
  }

  const maxScore = Math.max(...Object.values(scores), 1);
  return { scores, maxScore };
}
