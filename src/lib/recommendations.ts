import type { ProgramTemplate } from "../data/programs";

// Modification atomique proposée par le coach IA sur un programme existant.
export interface ProgramChange {
  programId: string;
  exerciseName: string;
  field: "sets" | "repsTarget" | "poidsTarget" | "objectif";
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface ProgramRecommendation {
  summary?: string;
  shortTerm: ProgramChange[];
  longTermNote?: string;
}

// Tente d'extraire un bloc JSON depuis la réponse du LLM (entre ```json ... ```
// ou directement parsable). Retourne null si rien d'exploitable.
export function extractRecommendation(
  raw: string,
): ProgramRecommendation | null {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1] : raw;
  // Cherche le premier objet JSON équilibré dans le candidat.
  const start = candidate.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < candidate.length; i++) {
    if (candidate[i] === "{") depth++;
    else if (candidate[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return null;
  try {
    const obj = JSON.parse(candidate.slice(start, end + 1));
    if (!obj || !Array.isArray(obj.shortTerm)) return null;
    const shortTerm: ProgramChange[] = obj.shortTerm
      .filter(
        (c: unknown): c is ProgramChange =>
          typeof c === "object" &&
          c !== null &&
          typeof (c as ProgramChange).programId === "string" &&
          typeof (c as ProgramChange).exerciseName === "string" &&
          ["sets", "repsTarget", "poidsTarget", "objectif"].includes(
            (c as ProgramChange).field,
          ) &&
          typeof (c as ProgramChange).newValue === "string",
      )
      .map((c: ProgramChange) => ({
        programId: c.programId,
        exerciseName: c.exerciseName,
        field: c.field,
        oldValue: String(c.oldValue ?? ""),
        newValue: String(c.newValue),
        reason: String(c.reason ?? ""),
      }));
    return {
      summary: typeof obj.summary === "string" ? obj.summary : undefined,
      shortTerm,
      longTermNote:
        typeof obj.longTermNote === "string" ? obj.longTermNote : undefined,
    };
  } catch {
    return null;
  }
}

// Applique une liste de changements sélectionnés à la copie des programmes.
// Retourne une nouvelle liste (immuable) — ne modifie pas l'entrée.
export function applyChanges(
  programs: ProgramTemplate[],
  changes: ProgramChange[],
): ProgramTemplate[] {
  return programs.map((p) => {
    const matching = changes.filter((c) => c.programId === p.id);
    if (!matching.length) return p;
    return {
      ...p,
      exercises: p.exercises.map((ex) => {
        const ch = matching.find((c) => c.exerciseName === ex.nom);
        if (!ch) return ex;
        const next = { ...ex };
        if (ch.field === "sets") {
          const n = parseInt(ch.newValue, 10);
          if (!isNaN(n) && n > 0) next.sets = n;
        } else if (ch.field === "repsTarget") {
          next.repsTarget = ch.newValue;
        } else if (ch.field === "poidsTarget") {
          next.poidsTarget = ch.newValue;
        } else if (ch.field === "objectif") {
          next.objectif = ch.newValue;
        }
        return next;
      }),
    };
  });
}

// Valeur courante d'un champ pour comparaison côté UI.
export function readField(
  programs: ProgramTemplate[],
  programId: string,
  exerciseName: string,
  field: ProgramChange["field"],
): string {
  const p = programs.find((x) => x.id === programId);
  if (!p) return "";
  const ex = p.exercises.find((x) => x.nom === exerciseName);
  if (!ex) return "";
  const v = ex[field];
  return v == null ? "" : String(v);
}
