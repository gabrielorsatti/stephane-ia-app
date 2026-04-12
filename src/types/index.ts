// Catégories d'exercices utilisées pour le regroupement et les stats.
export type Category =
  | "Poussée"
  | "Tirage"
  | "Jambes"
  | "Épaules"
  | "Bras"
  | "Abdos"
  | "Cardio"
  | "Autre";

export const ALL_CATEGORIES: Category[] = [
  "Poussée",
  "Tirage",
  "Jambes",
  "Épaules",
  "Bras",
  "Abdos",
  "Cardio",
  "Autre",
];

export interface SetEntry {
  reps: number;
  poids: number; // kg
}

export interface ExerciseEntry {
  nom: string;
  categorie: Category;
  sets: SetEntry[];
}

export interface Session {
  id: string;
  date: string; // ISO yyyy-mm-dd
  exercices: ExerciseEntry[];
  notes?: string;
  bodyWeight?: number;
}

export interface BodyWeightEntry {
  date: string; // ISO
  poids: number;
}
