import type { Category } from "../types";

// Exercice au sein d'un template de séance.
export interface ProgramExercise {
  nom: string;
  categorie: Category;
  sets: number;
  repsTarget: string; // "8", "12-10-8", "10-10-8"
  poidsTarget?: string; // "75kg", "Warmup 70 / Work 80", "PDC"
  objectif?: string; // "3x8 à 80kg propre"
  cues?: string[]; // conseils techniques
}

export interface ProgramTemplate {
  id: string;
  nom: string;
  description?: string;
  exercises: ProgramExercise[];
}

// Templates par défaut au premier lancement. Une fois copiés dans le store
// éditable (cf. lib/programsStore.ts), ils sont modifiables par l'utilisateur
// ou par les recommandations du Coach IA.
export const DEFAULT_PROGRAMS: ProgramTemplate[] = [
  {
    id: "push",
    nom: "PUSH",
    description: "Séance poussée optimisée (pecs + épaules + triceps).",
    exercises: [
      {
        nom: "Développé couché",
        categorie: "Poussée",
        sets: 3,
        repsTarget: "8",
        poidsTarget: "75 kg",
        objectif: "3×8 à 80 kg propre",
        cues: [
          "Omoplates serrées et verrouillées.",
          "Pieds bien ancrés au sol.",
          "Barre descend au niveau du bas du pec.",
        ],
      },
      {
        nom: "Développé incliné machine",
        categorie: "Poussée",
        sets: 3,
        repsTarget: "12",
        poidsTarget: "Warmup 70 kg / Work 80 kg",
        objectif: "3×12 à 80 kg",
        cues: [
          "Buste calé, pas de décollement.",
          "Pousse en visualisant le haut des pecs.",
        ],
      },
      {
        nom: "Pec fly",
        categorie: "Poussée",
        sets: 3,
        repsTarget: "12",
        poidsTarget: "15 → 25 kg",
        objectif: "Contraction maximale en fin de mouvement",
        cues: [
          "Coudes légèrement fléchis, fixes.",
          "Focus contraction, pas charge max.",
        ],
      },
      {
        nom: "Élévations latérales",
        categorie: "Épaules",
        sets: 3,
        repsTarget: "12-10-10",
        poidsTarget: "7-8 kg",
        objectif: "3×12 à 8 kg",
        cues: [
          "Lean back léger côté bras travaillé.",
          "Pas de triche avec le dos, tempo contrôlé.",
        ],
      },
      {
        nom: "Dips machine",
        categorie: "Poussée",
        sets: 3,
        repsTarget: "8-12",
        poidsTarget: "100 kg ou PDC",
        objectif: "3×12 à 100 kg (finisher)",
        cues: ["Buste légèrement incliné vers l'avant."],
      },
    ],
  },
  {
    id: "pull",
    nom: "PULL",
    description: "Séance tirage avec focus biceps.",
    exercises: [
      {
        nom: "Tractions pronation",
        categorie: "Tirage",
        sets: 3,
        repsTarget: "12-10-8",
        poidsTarget: "PDC",
        objectif: "3×12 propres d'ici fin février",
        cues: [
          "Omoplates basses, pas de shrug.",
          "Tire avec les coudes, pas les bras.",
        ],
      },
      {
        nom: "Curl incliné",
        categorie: "Bras",
        sets: 3,
        repsTarget: "10",
        poidsTarget: "12 kg",
        objectif: "3×12 à 12 kg propre",
        cues: [
          "Banc à 45°, coudes fixes derrière le buste.",
          "Étirement complet en bas.",
        ],
      },
      {
        nom: "Tirage vertical",
        categorie: "Tirage",
        sets: 3,
        repsTarget: "10",
        poidsTarget: "Warmup 60 / Work 70 kg",
        cues: [
          "Prise neutre ou supination.",
          "Tire la barre vers le haut des pecs, buste légèrement en arrière.",
        ],
      },
      {
        nom: "Rowing unilatéral",
        categorie: "Tirage",
        sets: 3,
        repsTarget: "12",
        poidsTarget: "45 kg",
        objectif: "3×12 à 50 kg",
        cues: [
          "Main libre en appui, dos neutre.",
          "Tire avec le coude bien collé au corps.",
        ],
      },
    ],
  },
  {
    id: "mixte",
    nom: "MIXTE",
    description: "Rappel pousser/tirer + volume bras.",
    exercises: [
      {
        nom: "Dips lestés",
        categorie: "Poussée",
        sets: 4,
        repsTarget: "10-10-10-8",
        poidsTarget: "0 / 10 / 20 / 20 kg",
        objectif: "20 kg × 12 sans balancement",
        cues: ["Pas de balancement, descente contrôlée."],
      },
      {
        nom: "French press",
        categorie: "Bras",
        sets: 3,
        repsTarget: "10",
        poidsTarget: "10 kg",
        cues: [
          "Poulie haute, coudes fixes pointant vers le haut.",
          "Focus longue portion du triceps.",
        ],
      },
      {
        nom: "Élévations poulie",
        categorie: "Épaules",
        sets: 3,
        repsTarget: "10",
        poidsTarget: "5 kg",
        objectif: "7,5 kg × 8 propre",
        cues: ["Câble passe devant le corps, main finit à hauteur d'épaule."],
      },
    ],
  },
];

// Lookup helpers — opèrent sur une liste de programmes passée en paramètre
// pour rester compatibles avec le store éditable (cf. programsStore.ts).
// L'API legacy `cuesFor(nom)` / `objectiveFor(nom)` lit désormais depuis le
// store en runtime via getProgramsSync.
import { getProgramsSync } from "../lib/programsStore";

export function cuesForIn(programs: ProgramTemplate[], nom: string): string[] {
  const cues: string[] = [];
  for (const prog of programs) {
    for (const ex of prog.exercises) {
      if (ex.nom === nom && ex.cues) cues.push(...ex.cues);
    }
  }
  return [...new Set(cues)];
}

export function objectiveForIn(
  programs: ProgramTemplate[],
  nom: string,
): string | undefined {
  for (const prog of programs) {
    for (const ex of prog.exercises) {
      if (ex.nom === nom && ex.objectif) return ex.objectif;
    }
  }
  return undefined;
}

export function cuesFor(nom: string): string[] {
  return cuesForIn(getProgramsSync(), nom);
}

export function objectiveFor(nom: string): string | undefined {
  return objectiveForIn(getProgramsSync(), nom);
}
