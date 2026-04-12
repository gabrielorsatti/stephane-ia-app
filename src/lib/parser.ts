import type { ExerciseEntry, SetEntry } from "../types";
import { findExercise } from "./exercises";

// Normalisation « douce » : minuscules + suppression d'accents, mais on
// conserve la ponctuation (`*`, `,`, `.`, `@`) nécessaire aux regex numériques.
function softNormalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Résultat du parser : une liste d'exercices reconnus + les segments non reconnus.
export interface ParseResult {
  exercices: ExerciseEntry[];
  unrecognized: string[];
}

// Sépare une saisie libre en segments (un exercice = un segment).
function splitSegments(input: string): string[] {
  return input
    .split(/\n|;|(?:,\s*(?=\D))|(?:\s+puis\s+)|(?:\s+et\s+(?=\d))/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Extrait un nombre décimal (accepte virgule).
function toNumber(s: string): number {
  return parseFloat(s.replace(",", "."));
}

// Parse un segment unique. Retourne null si aucun exercice n'est détecté.
// Exemples gérés :
//   "3 séries de 12 rep de DC à 80kg"
//   "4x10 squat 100kg"
//   "développé couché 3x12 @ 80"
//   "DC 80kg 3x12"
//   "5x5 SDT 120"
//   "curl 3*10 à 15"
export function parseSegment(segment: string): ExerciseEntry | null {
  const raw = segment.trim();
  if (!raw) return null;
  const norm = softNormalize(raw);

  // 1. Extraction des sets : "NxM", "N*M", "N séries de M", "N séries M rep"
  let sets = 0;
  let reps = 0;
  const setsRepsMatch =
    norm.match(/(\d+)\s*(?:x|\*|×)\s*(\d+)/) ||
    norm.match(/(\d+)\s*series?\s*(?:de\s*)?(\d+)/) ||
    norm.match(/(\d+)\s*sets?\s*(?:de\s*|of\s*)?(\d+)/);
  if (setsRepsMatch) {
    sets = parseInt(setsRepsMatch[1], 10);
    reps = parseInt(setsRepsMatch[2], 10);
  }

  // 2. Extraction du poids : "80kg", "à 80", "@80", "80 kg"
  let poids = 0;
  const weightMatch =
    norm.match(/(?:a|@)\s*(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)?/) ||
    norm.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)\b/);
  if (weightMatch) {
    poids = toNumber(weightMatch[1]);
  } else if (setsRepsMatch) {
    // Fallback : troisième nombre isolé après le motif sets x reps.
    const after = norm.slice(setsRepsMatch.index! + setsRepsMatch[0].length);
    const fallback = after.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?:\s|$)/);
    if (fallback) poids = toNumber(fallback[1]);
  }

  // 3. Identification de l'exercice dans le texte.
  const def = findExercise(raw);
  if (!def) return null;

  // 4. Si on a sets+reps sans poids, on garde poids = 0 (poids de corps).
  if (!sets || !reps) return null;

  const setList: SetEntry[] = Array.from({ length: sets }, () => ({
    reps,
    poids,
  }));

  return {
    nom: def.canonical,
    categorie: def.categorie,
    sets: setList,
  };
}

// Parse l'ensemble de la saisie en plusieurs exercices.
export function parseInput(input: string): ParseResult {
  const segments = splitSegments(input);
  const exercices: ExerciseEntry[] = [];
  const unrecognized: string[] = [];

  for (const seg of segments) {
    const ex = parseSegment(seg);
    if (ex) exercices.push(ex);
    else if (seg.length > 0) unrecognized.push(seg);
  }

  return { exercices, unrecognized };
}
