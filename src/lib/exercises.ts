import type { Category } from "../types";

// Catalogue d'exercices avec aliases pour le parser NLP.
// Chaque entrée mappe un nom canonique + catégorie + liste d'alias (minuscules, sans accent).
export interface ExerciseDef {
  canonical: string;
  categorie: Category;
  aliases: string[];
}

export const EXERCISE_CATALOG: ExerciseDef[] = [
  // Poussée
  {
    canonical: "Développé couché",
    categorie: "Poussée",
    aliases: ["dc", "developpe couche", "bench", "bench press", "dev couche"],
  },
  {
    canonical: "Développé incliné",
    categorie: "Poussée",
    aliases: ["di", "developpe incline", "incline bench", "dev incline"],
  },
  {
    canonical: "Développé incliné machine",
    categorie: "Poussée",
    aliases: [
      "di machine",
      "developpe incline machine",
      "machine convergente",
      "incline machine",
      "convergente",
    ],
  },
  {
    canonical: "Développé couché haltères",
    categorie: "Poussée",
    aliases: [
      "dc halteres",
      "dc haltere",
      "developpe couche halteres",
      "db bench",
      "dumbbell bench",
    ],
  },
  {
    canonical: "Pec fly",
    categorie: "Poussée",
    aliases: [
      "pec fly",
      "pec deck",
      "ecarte machine",
      "ecarte",
      "butterfly",
      "peck deck",
    ],
  },
  {
    canonical: "Dips machine",
    categorie: "Poussée",
    aliases: ["dips machine", "machine dips", "dips assiste"],
  },
  {
    canonical: "Dips lestés",
    categorie: "Poussée",
    aliases: ["dips lestes", "weighted dips"],
  },
  {
    canonical: "Développé décliné",
    categorie: "Poussée",
    aliases: ["dd", "developpe decline", "decline bench"],
  },
  {
    canonical: "Dips",
    categorie: "Poussée",
    aliases: ["dips", "dip"],
  },
  {
    canonical: "Pompes",
    categorie: "Poussée",
    aliases: ["pompes", "push up", "push-up", "pushup"],
  },
  // Tirage
  {
    canonical: "Soulevé de terre",
    categorie: "Tirage",
    aliases: ["sdt", "souleve de terre", "deadlift", "dl"],
  },
  {
    canonical: "Tractions",
    categorie: "Tirage",
    aliases: ["tractions", "traction", "pull up", "pull-up", "pullup"],
  },
  {
    canonical: "Tractions pronation",
    categorie: "Tirage",
    aliases: [
      "tractions pronation",
      "traction pronation",
      "pull-up pronation",
    ],
  },
  {
    canonical: "Rowing barre",
    categorie: "Tirage",
    aliases: ["rowing", "rowing barre", "barbell row", "bb row"],
  },
  {
    canonical: "Rowing haltère",
    categorie: "Tirage",
    aliases: ["rowing haltere", "db row", "dumbbell row"],
  },
  {
    canonical: "Tirage vertical",
    categorie: "Tirage",
    aliases: [
      "tirage vertical",
      "tirage vertical neutre",
      "tirage vertical supi",
      "tirage neutre",
      "lat pulldown",
      "pulldown",
    ],
  },
  {
    canonical: "Tirage horizontal",
    categorie: "Tirage",
    aliases: ["tirage horizontal", "seated row", "row machine"],
  },
  {
    canonical: "Rowing unilatéral",
    categorie: "Tirage",
    aliases: [
      "rowing unilateral",
      "rowing uni",
      "rowing poulie",
      "unilateral row",
      "one arm row",
    ],
  },
  // Jambes
  {
    canonical: "Squat",
    categorie: "Jambes",
    aliases: ["squat", "back squat", "squat barre"],
  },
  {
    canonical: "Front squat",
    categorie: "Jambes",
    aliases: ["front squat"],
  },
  {
    canonical: "Presse à cuisses",
    categorie: "Jambes",
    aliases: ["presse", "presse a cuisses", "leg press"],
  },
  {
    canonical: "Fentes",
    categorie: "Jambes",
    aliases: ["fentes", "fente", "lunge", "lunges"],
  },
  {
    canonical: "Leg extension",
    categorie: "Jambes",
    aliases: ["leg extension", "extension"],
  },
  {
    canonical: "Leg curl",
    categorie: "Jambes",
    aliases: ["leg curl", "ischio"],
  },
  {
    canonical: "Mollets",
    categorie: "Jambes",
    aliases: ["mollets", "calf", "calf raise"],
  },
  // Épaules
  {
    canonical: "Développé militaire",
    categorie: "Épaules",
    aliases: ["ohp", "developpe militaire", "overhead press", "dev militaire"],
  },
  {
    canonical: "Élévations latérales",
    categorie: "Épaules",
    aliases: ["elevations laterales", "elevation laterale", "lateral raise"],
  },
  {
    canonical: "Oiseau",
    categorie: "Épaules",
    aliases: ["oiseau", "rear delt", "face pull"],
  },
  // Bras
  {
    canonical: "Curl biceps",
    categorie: "Bras",
    aliases: ["curl", "curl biceps", "biceps curl", "bb curl", "db curl"],
  },
  {
    canonical: "Curl marteau",
    categorie: "Bras",
    aliases: ["curl marteau", "hammer curl"],
  },
  {
    canonical: "Curl incliné",
    categorie: "Bras",
    aliases: [
      "curl incline",
      "incline curl",
      "curl banc incline",
      "curl 45",
    ],
  },
  {
    canonical: "French press",
    categorie: "Bras",
    aliases: [
      "french press",
      "french press poulie",
      "barre au front poulie",
    ],
  },
  {
    canonical: "Élévations poulie",
    categorie: "Épaules",
    aliases: [
      "elevations poulie",
      "elevation poulie",
      "lateral cable",
      "lateral raise cable",
    ],
  },
  {
    canonical: "Extension triceps",
    categorie: "Bras",
    aliases: ["extension triceps", "triceps extension", "skull crusher"],
  },
  {
    canonical: "Pushdown",
    categorie: "Bras",
    aliases: ["pushdown", "triceps pushdown", "poulie triceps"],
  },
  // Abdos
  {
    canonical: "Crunch",
    categorie: "Abdos",
    aliases: ["crunch", "crunchs"],
  },
  {
    canonical: "Gainage",
    categorie: "Abdos",
    aliases: ["gainage", "plank", "planche"],
  },
];

// Normalise une chaîne pour la comparaison (minuscules, sans accents, sans ponctuation).
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Trouve un exercice à partir d'un texte libre. Retourne undefined si aucun match.
export function findExercise(text: string): ExerciseDef | undefined {
  const n = normalize(text);
  // Match exact sur alias, on favorise l'alias le plus long.
  const candidates: { def: ExerciseDef; len: number }[] = [];
  for (const def of EXERCISE_CATALOG) {
    for (const alias of def.aliases) {
      const a = normalize(alias);
      const re = new RegExp(`(^|\\s)${escapeRegex(a)}($|\\s)`);
      if (re.test(n)) candidates.push({ def, len: a.length });
    }
  }
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => b.len - a.len);
  return candidates[0].def;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Retourne la catégorie associée à un nom donné, ou "Autre" si inconnu.
export function categoryFor(nom: string): Category {
  const def = findExercise(nom);
  return def?.categorie ?? "Autre";
}
