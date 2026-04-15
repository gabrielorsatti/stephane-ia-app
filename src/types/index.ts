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
  // kg. Pour les exercices au poids du corps, ce champ représente le LEST
  // (charge ajoutée) : 0 = PDC seul, 20 = tractions +20 kg à la ceinture.
  // Pour les exercices strength, c'est la charge absolue sur la barre/machine.
  poids: number;
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

// Repas/snack enregistré côté nutrition. `foodText` est la saisie libre
// originale ; les 4 macros sont extraites par l'IA (ou estimées).
export interface NutritionLog {
  id: string;
  date: string; // ISO yyyy-mm-dd
  foodText: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string; // ISO timestamp — sert au tri intra-journée
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
  // Records spécifiques aux exercices bodyweight : meilleure série sans lest
  // (maxReps à poids 0) — complète maxPoids qui représente alors le record lesté.
  maxRepsBodyweight?: number;
  maxRepsBodyweightDate?: string;
  notes?: string;
}
