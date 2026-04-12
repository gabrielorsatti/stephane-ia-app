import type { PersonalRecordOverride, Session } from "../types";
import { categoryFor } from "./exercises";
import { estimate1RM } from "./scoring";

// Record personnel sur un mouvement.
export interface PersonalRecord {
  nom: string;
  categorie: string;
  maxPoids: number;
  maxPoidsReps: number; // reps associées au set du max poids
  maxPoidsDate: string;
  best1RM: number;
  best1RMDate: string;
  totalSessions: number;
  // Indique qu'au moins un champ est un override manuel.
  manualOverride?: boolean;
  notes?: string;
}

// Calcule les PR pour chaque exercice à partir des séances, puis applique
// les surcharges manuelles. Les exercices présents uniquement dans les
// overrides sont aussi listés (utile pour un PR historique non tracké).
export function computeRecords(
  sessions: Session[],
  overrides: PersonalRecordOverride[] = [],
): PersonalRecord[] {
  const byName = new Map<string, PersonalRecord>();

  for (const session of sessions) {
    for (const ex of session.exercices) {
      let pr = byName.get(ex.nom);
      if (!pr) {
        pr = {
          nom: ex.nom,
          categorie: ex.categorie,
          maxPoids: 0,
          maxPoidsReps: 0,
          maxPoidsDate: session.date,
          best1RM: 0,
          best1RMDate: session.date,
          totalSessions: 0,
        };
        byName.set(ex.nom, pr);
      }
      pr.totalSessions += 1;

      for (const set of ex.sets) {
        if (set.poids > pr.maxPoids) {
          pr.maxPoids = set.poids;
          pr.maxPoidsReps = set.reps;
          pr.maxPoidsDate = session.date;
        }
        const rm = estimate1RM(set);
        if (rm > pr.best1RM) {
          pr.best1RM = rm;
          pr.best1RMDate = session.date;
        }
      }
    }
  }

  // Applique les overrides : chaque champ renseigné écrase la valeur calculée.
  for (const ov of overrides) {
    const existing = byName.get(ov.nom);
    const base: PersonalRecord = existing ?? {
      nom: ov.nom,
      categorie: ov.categorie ?? categoryFor(ov.nom),
      maxPoids: 0,
      maxPoidsReps: 0,
      maxPoidsDate: ov.maxPoidsDate ?? ov.best1RMDate ?? "",
      best1RM: 0,
      best1RMDate: ov.best1RMDate ?? ov.maxPoidsDate ?? "",
      totalSessions: 0,
    };
    const merged: PersonalRecord = {
      ...base,
      categorie: ov.categorie ?? base.categorie,
      maxPoids: ov.maxPoids ?? base.maxPoids,
      maxPoidsReps: ov.maxPoidsReps ?? base.maxPoidsReps,
      maxPoidsDate: ov.maxPoidsDate ?? base.maxPoidsDate,
      best1RM: ov.best1RM ?? base.best1RM,
      best1RMDate: ov.best1RMDate ?? base.best1RMDate,
      notes: ov.notes,
      manualOverride: true,
    };
    byName.set(ov.nom, merged);
  }

  return [...byName.values()].sort((a, b) => b.best1RM - a.best1RM);
}
