import type { CardioData, ExerciseEntry, Intensity, SetEntry } from "../types";
import { parsePace } from "./cardio";
import { findExercise } from "./exercises";

const DURATION_CATEGORIES = new Set(["Cours Collectif", "Mobilité"]);

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

  // 0b. Cours collectif / Mobilité : durée + intensité optionnelle.
  if (def0 && DURATION_CATEGORIES.has(def0.categorie)) {
    const duration = extractDuration(norm);
    const intensity = extractIntensity(norm);
    return {
      nom: def0.canonical,
      categorie: def0.categorie,
      sets: [],
      durationMinutes: duration ?? 45,
      intensity: intensity ?? "modéré",
    };
  }

  // 1. Extraction du poids (avant sets/reps pour ne pas confondre les nombres).
  let poids = 0;
  const weightMatch =
    norm.match(/(?:a|@)\s*(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)?/) ||
    norm.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kgs)\b/);
  if (weightMatch) {
    poids = toNumber(weightMatch[1]);
  }

  // 2. Extraction des sets et reps — ordre flexible.
  let sets = 0;
  let reps = 0;

  // 2a. Forme compacte : "3x10", "3*10", "3×10"
  const compactMatch =
    norm.match(/(\d+)\s*(?:x|\*|×)\s*(\d+)(?!\s*(?:kg|kgs)\b)/);
  if (compactMatch) {
    sets = parseInt(compactMatch[1], 10);
    reps = parseInt(compactMatch[2], 10);
  }

  // 2b. Forme "N séries de M" / "N sets de M"
  if (!sets) {
    const setsDeMatch =
      norm.match(/(\d+)\s*series?\s*(?:de\s*)?(\d+)/) ||
      norm.match(/(\d+)\s*sets?\s*(?:de\s*|of\s*)?(\d+)/);
    if (setsDeMatch) {
      sets = parseInt(setsDeMatch[1], 10);
      reps = parseInt(setsDeMatch[2], 10);
    }
  }

  // 2c. Forme inversée : "10 reps x 3", "10 rep x 3"
  if (!sets) {
    const repsFirstMatch = norm.match(
      /(\d+)\s*(?:reps?|repetitions?)\s*(?:x|\*|×)\s*(\d+)/,
    );
    if (repsFirstMatch) {
      reps = parseInt(repsFirstMatch[1], 10);
      sets = parseInt(repsFirstMatch[2], 10);
    }
  }

  // 2d. Composants séparés : "3 sets 10 reps" ou "10 reps 3 sets" (ordre libre)
  if (!sets) {
    const setsAlone = norm.match(/(\d+)\s*(?:sets?|series?)\b/);
    const repsAlone = norm.match(/(\d+)\s*(?:reps?|repetitions?)\b/);
    if (setsAlone && repsAlone) {
      sets = parseInt(setsAlone[1], 10);
      reps = parseInt(repsAlone[1], 10);
    }
  }

  // 2e. Reps seules sans sets explicites → 1 set ("DC 10 à 80kg", "10 reps DC 80kg")
  if (!sets && !reps) {
    const repsOnly = norm.match(/(\d+)\s*(?:reps?|repetitions?)\b/);
    if (repsOnly) {
      reps = parseInt(repsOnly[1], 10);
      sets = 1;
    }
  }

  // Fallback poids : troisième nombre isolé si pas encore trouvé.
  if (!poids && compactMatch) {
    const after = norm.slice(compactMatch.index! + compactMatch[0].length);
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

function extractDuration(norm: string): number | null {
  const hhmm = norm.match(/(\d+)\s*h\s*(\d{1,2})/);
  if (hhmm) return parseInt(hhmm[1], 10) * 60 + parseInt(hhmm[2], 10);
  const hOnly = norm.match(/(\d+(?:[.,]\d+)?)\s*h\b/);
  if (hOnly) return Math.round(parseFloat(hOnly[1].replace(",", ".")) * 60);
  const mOnly = norm.match(/(\d+(?:[.,]\d+)?)\s*(?:min|minutes?|mn|')\b/);
  if (mOnly) return Math.round(parseFloat(mOnly[1].replace(",", ".")));
  const bare = norm.match(/(\d+)\s*(?:$|\s)/);
  if (bare) {
    const n = parseInt(bare[1], 10);
    if (n >= 10 && n <= 180) return n;
  }
  return null;
}

function extractIntensity(norm: string): Intensity | null {
  if (/intense|fort|hard|difficile|max/.test(norm)) return "intense";
  if (/modere|moyen|medium|normal/.test(norm)) return "modéré";
  if (/leger|doux|soft|light|facile|tranquille/.test(norm)) return "léger";
  return null;
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
