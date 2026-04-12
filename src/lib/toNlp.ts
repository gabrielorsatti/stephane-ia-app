import type { ExerciseEntry, Session } from "../types";

// Convertit un exercice en ligne NLP ré-éditable par l'utilisateur.
// Règle : si toutes les séries ont même reps/poids -> format "NxM à Pkg",
// sinon on détaille chaque série.
function exerciseToNlp(ex: ExerciseEntry): string {
  if (ex.sets.length === 0) return ex.nom;
  const first = ex.sets[0];
  const uniform = ex.sets.every(
    (s) => s.reps === first.reps && s.poids === first.poids,
  );
  if (uniform) {
    const poids = first.poids > 0 ? ` à ${first.poids}kg` : "";
    return `${ex.sets.length}x${first.reps} ${ex.nom}${poids}`;
  }
  // Format détaillé : une ligne par série, reps × poids
  return ex.sets
    .map((s) => {
      const poids = s.poids > 0 ? ` à ${s.poids}kg` : "";
      return `1x${s.reps} ${ex.nom}${poids}`;
    })
    .join("\n");
}

export function sessionToNlp(session: Session): string {
  return session.exercices.map(exerciseToNlp).join("\n");
}
