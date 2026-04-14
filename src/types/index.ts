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

// Champ optionnel pour le cardio : distance (km), durée (min), dénivelé (m).
// Renseigné sur un ExerciseEntry de catégorie "Cardio" en plus (ou à la place)
// des séries reps/poids. L'allure (min/km) est calculée à la volée depuis
// distance + duree — pas stockée pour garder la source de vérité unique.
export interface CardioData {
  distance?: number;
  duree?: number;
  denivele?: number;
}

export interface ExerciseEntry {
  nom: string;
  categorie: Category;
  sets: SetEntry[];
  cardio?: CardioData;
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

// Surcharge manuelle des PR pour un exercice donné. Tous les champs sont
// optionnels : ceux qui sont renseignés remplacent la valeur calculée à
// partir des séances, les autres restent déduits automatiquement.
export interface PersonalRecordOverride {
  nom: string;
  categorie?: Category;
  maxPoids?: number;
  maxPoidsReps?: number;
  maxPoidsDate?: string;
  best1RM?: number;
  best1RMDate?: string;
  notes?: string;
}
