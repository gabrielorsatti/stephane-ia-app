import type { Session } from "../types";
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
}

// Calcule les PR pour chaque exercice présent dans les séances.
export function computeRecords(sessions: Session[]): PersonalRecord[] {
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

  return [...byName.values()].sort((a, b) => b.best1RM - a.best1RM);
}
