import type { CardioData, ExerciseEntry, SetEntry } from "../types";
import { parsePace } from "./cardio";
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

  // 0. Tentative cardio en priorité : on reconnaît un exercice Cardio
  //    accompagné d'au moins une donnée (distance, durée ou dénivelé).
  const def0 = findExercise(raw);
  if (def0 && def0.categorie === "Cardio") {
    const cardio = extractCardioData(norm);
    if (cardio) {
      return {
        nom: def0.canonical,
        categorie: def0.categorie,
        sets: [],
        cardio,
      };
    }
  }

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

// Extrait distance (km), durée (min), dénivelé (m) et — si présente — allure
// d'une ligne cardio normalisée. Retourne null si rien d'exploitable.
// Formats couverts :
//   "course 5km en 25min"
//   "velo 20km allure 3:00"
//   "course 10km 45min +100m"
//   "course 45min" (durée seule)
function extractCardioData(norm: string): CardioData | null {
  const out: CardioData = {};

  const dist = norm.match(/(\d+(?:[.,]\d+)?)\s*km\b/);
  if (dist) out.distance = parseFloat(dist[1].replace(",", "."));

  // Durée : "25min", "1h30", "1h", "90 minutes"
  const hhmm = norm.match(/(\d+)\s*h\s*(\d{1,2})/);
  const hOnly = !hhmm && norm.match(/(\d+(?:[.,]\d+)?)\s*h\b/);
  const mOnly =
    !hhmm && norm.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minutes?|mn)\b/);
  if (hhmm) {
    out.duree = parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  } else if (hOnly) {
    out.duree = parseFloat(hOnly[1].replace(",", "")) * 60;
  } else if (mOnly) {
    out.duree = parseFloat(mOnly[1].replace(",", "."));
  }

  // Dénivelé : "+100m", "100m D+", "denivele 100"
  const den =
    norm.match(/\+\s*(\d+)\s*m\b/) ||
    norm.match(/(\d+)\s*m\s*d\+/) ||
    norm.match(/denivele?\s*(\d+)/);
  if (den) out.denivele = parseInt(den[1], 10);

  // Allure : "allure 3:00", "allure 4.30", "@3:00/km"
  const paceMatch = norm.match(
    /(?:allure|pace|@)\s*(\d+[:.]\d{1,2}|\d+(?:[.,]\d+)?)\s*(?:\/km)?/,
  );
  if (paceMatch && !out.duree && out.distance) {
    const pace = parsePace(paceMatch[1]);
    if (pace) out.duree = Math.round(pace * out.distance);
  }

  const hasAny =
    out.distance != null || out.duree != null || out.denivele != null;
  return hasAny ? out : null;
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
