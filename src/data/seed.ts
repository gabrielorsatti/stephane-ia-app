import type { BodyWeightEntry, Session } from "../types";

// Données de démarrage ("baseline" = temps T0).
// Trois snapshots historiques issus du carnet de l'utilisateur sont traduits
// en sessions synthétiques pour alimenter les graphiques dès le 1er lancement.
// Chaque snapshot agrège les PR de la période — pas une séance réelle.

export const SEED_BODY_WEIGHTS: BodyWeightEntry[] = [
  { date: "2025-05-01", poids: 73 },
  { date: "2025-10-01", poids: 79 },
  { date: "2026-03-01", poids: 80 },
];

export const SEED_SESSIONS: Session[] = [
  {
    id: "seed-2025-05",
    date: "2025-05-01",
    bodyWeight: 73,
    notes: "Snapshot début de suivi (mai 2025, 73kg).",
    exercices: [
      {
        nom: "Développé couché",
        categorie: "Poussée",
        sets: [{ reps: 6, poids: 50 }],
      },
      {
        nom: "Tractions",
        categorie: "Tirage",
        sets: [{ reps: 9, poids: 0 }],
      },
      {
        nom: "Curl biceps",
        categorie: "Bras",
        sets: [{ reps: 10, poids: 8 }],
      },
      {
        nom: "Développé militaire",
        categorie: "Épaules",
        sets: [{ reps: 8, poids: 14 }],
      },
      {
        nom: "Pompes",
        categorie: "Poussée",
        sets: [{ reps: 20, poids: 0 }],
      },
    ],
  },
  {
    id: "seed-2025-10",
    date: "2025-10-01",
    bodyWeight: 79,
    notes: "Snapshot prise de masse (octobre 2025, 79kg).",
    exercices: [
      {
        nom: "Développé couché",
        categorie: "Poussée",
        sets: [{ reps: 6, poids: 75 }],
      },
      {
        nom: "Dips lestés",
        categorie: "Poussée",
        sets: [{ reps: 3, poids: 40 }],
      },
      {
        nom: "Développé militaire",
        categorie: "Épaules",
        sets: [{ reps: 8, poids: 22 }],
      },
      {
        nom: "Tirage vertical",
        categorie: "Tirage",
        sets: [{ reps: 10, poids: 60 }],
      },
    ],
  },
  {
    id: "seed-2026-03",
    date: "2026-03-01",
    bodyWeight: 80,
    notes: "Snapshot actuel (mars 2026, 80kg).",
    exercices: [
      {
        nom: "Développé couché",
        categorie: "Poussée",
        sets: [{ reps: 8, poids: 80 }],
      },
      {
        nom: "Développé couché haltères",
        categorie: "Poussée",
        sets: [{ reps: 8, poids: 32 }],
      },
      {
        nom: "Tractions",
        categorie: "Tirage",
        sets: [{ reps: 17, poids: 0 }],
      },
      {
        nom: "Élévations latérales",
        categorie: "Épaules",
        sets: [{ reps: 12, poids: 10 }],
      },
    ],
  },
  {
    id: "seed-2026-04",
    date: "2026-04-05",
    bodyWeight: 80,
    notes: "PR deadlift avril 2026.",
    exercices: [
      {
        nom: "Soulevé de terre",
        categorie: "Tirage",
        sets: [{ reps: 3, poids: 110 }],
      },
    ],
  },
];
