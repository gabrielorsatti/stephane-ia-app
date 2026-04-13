import type { Category } from "../types";

// Catalogue d'exercices avec aliases pour le parser NLP.
// Chaque entrée mappe un nom canonique + catégorie + liste d'alias (minuscules, sans accent).
export interface ExerciseDef {
  canonical: string;
  categorie: Category;
  aliases: string[];
}

export const EXERCISE_CATALOG: ExerciseDef[] = [
  // ────────── Poussée (pectoraux, triceps, deltoïdes antérieurs) ──────────
  {
    canonical: "Développé couché",
    categorie: "Poussée",
    aliases: [
      "dc",
      "developpe couche",
      "developpe couche barre",
      "dc barre",
      "bench",
      "bench press",
      "dev couche",
    ],
  },
  {
    canonical: "Développé couché haltères",
    categorie: "Poussée",
    aliases: [
      "dc halteres",
      "dc haltere",
      "developpe couche halteres",
      "developpe couche haltere",
      "db bench",
      "dumbbell bench",
    ],
  },
  {
    canonical: "Développé couché machine",
    categorie: "Poussée",
    aliases: [
      "dc machine",
      "developpe couche machine",
      "machine chest press",
      "chest press",
    ],
  },
  {
    canonical: "Développé incliné",
    categorie: "Poussée",
    aliases: [
      "di",
      "developpe incline",
      "developpe incline barre",
      "incline bench",
      "dev incline",
    ],
  },
  {
    canonical: "Développé incliné haltères",
    categorie: "Poussée",
    aliases: [
      "di halteres",
      "di haltere",
      "developpe incline halteres",
      "developpe incline haltere",
      "incline db",
    ],
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
    canonical: "Développé décliné",
    categorie: "Poussée",
    aliases: [
      "dd",
      "developpe decline",
      "developpe decline barre",
      "decline bench",
    ],
  },
  {
    canonical: "Développé décliné haltères",
    categorie: "Poussée",
    aliases: ["dd halteres", "developpe decline halteres", "decline db"],
  },
  {
    canonical: "Écarté haltères",
    categorie: "Poussée",
    aliases: [
      "ecarte halteres",
      "ecarte haltere",
      "ecarte db",
      "db fly",
      "dumbbell fly",
    ],
  },
  {
    canonical: "Écarté incliné haltères",
    categorie: "Poussée",
    aliases: [
      "ecarte incline",
      "ecarte incline halteres",
      "incline fly",
      "incline db fly",
    ],
  },
  {
    canonical: "Pec deck",
    categorie: "Poussée",
    aliases: [
      "pec deck",
      "pec fly",
      "ecarte machine",
      "butterfly",
      "peck deck",
    ],
  },
  {
    canonical: "Écarté poulie vis-à-vis",
    categorie: "Poussée",
    aliases: [
      "ecarte poulie",
      "ecarte poulie vis-a-vis",
      "ecarte vis a vis",
      "cable fly",
      "cable crossover",
      "crossover",
    ],
  },
  {
    canonical: "Dips",
    categorie: "Poussée",
    aliases: ["dips", "dip"],
  },
  {
    canonical: "Dips lestés",
    categorie: "Poussée",
    aliases: ["dips lestes", "weighted dips", "dips lest"],
  },
  {
    canonical: "Dips machine",
    categorie: "Poussée",
    aliases: ["dips machine", "machine dips", "dips assiste"],
  },
  {
    canonical: "Pompes",
    categorie: "Poussée",
    aliases: ["pompes", "push up", "push-up", "pushup"],
  },
  {
    canonical: "Pompes lestées",
    categorie: "Poussée",
    aliases: ["pompes lestees", "pompes lestes", "weighted push up"],
  },

  // ────────── Tirage (dos, biceps en tirage, trapèzes) ──────────
  {
    canonical: "Soulevé de terre",
    categorie: "Tirage",
    aliases: [
      "sdt",
      "souleve de terre",
      "souleve de terre conventionnel",
      "deadlift",
      "dl",
    ],
  },
  {
    canonical: "Soulevé de terre roumain",
    categorie: "Tirage",
    aliases: [
      "sdt roumain",
      "souleve de terre roumain",
      "rdl",
      "romanian deadlift",
    ],
  },
  {
    canonical: "Soulevé de terre sumo",
    categorie: "Tirage",
    aliases: ["sdt sumo", "souleve de terre sumo", "sumo deadlift"],
  },
  {
    canonical: "Tractions",
    categorie: "Tirage",
    aliases: [
      "tractions",
      "traction",
      "pull up",
      "pull-up",
      "pullup",
      "tractions pronation",
      "traction pronation",
    ],
  },
  {
    canonical: "Tractions supination",
    categorie: "Tirage",
    aliases: [
      "tractions supination",
      "traction supination",
      "chin up",
      "chin-up",
      "chinup",
    ],
  },
  {
    canonical: "Tractions neutres",
    categorie: "Tirage",
    aliases: [
      "tractions neutres",
      "traction neutre",
      "tractions prise neutre",
      "neutral pull up",
    ],
  },
  {
    canonical: "Tractions lestées",
    categorie: "Tirage",
    aliases: ["tractions lestees", "tractions lestes", "weighted pull up"],
  },
  {
    canonical: "Tirage vertical",
    categorie: "Tirage",
    aliases: [
      "tirage vertical",
      "tirage vertical poulie",
      "tirage nuque",
      "lat pulldown",
      "pulldown",
    ],
  },
  {
    canonical: "Tirage vertical supination",
    categorie: "Tirage",
    aliases: [
      "tirage vertical supination",
      "tirage supi",
      "tirage supination",
      "supinated pulldown",
    ],
  },
  {
    canonical: "Tirage vertical neutre",
    categorie: "Tirage",
    aliases: [
      "tirage vertical neutre",
      "tirage neutre",
      "neutral pulldown",
    ],
  },
  {
    canonical: "Tirage horizontal",
    categorie: "Tirage",
    aliases: [
      "tirage horizontal",
      "tirage horizontal machine",
      "seated row",
      "row machine",
    ],
  },
  {
    canonical: "Tirage horizontal poulie",
    categorie: "Tirage",
    aliases: [
      "tirage horizontal poulie",
      "tirage poulie basse",
      "low row",
      "cable row",
    ],
  },
  {
    canonical: "Rowing barre",
    categorie: "Tirage",
    aliases: ["rowing", "rowing barre", "barbell row", "bb row", "bent over row"],
  },
  {
    canonical: "Rowing barre supination",
    categorie: "Tirage",
    aliases: [
      "rowing supination",
      "rowing yates",
      "yates row",
      "rowing barre supi",
    ],
  },
  {
    canonical: "Rowing haltère",
    categorie: "Tirage",
    aliases: [
      "rowing haltere",
      "rowing halteres",
      "db row",
      "dumbbell row",
      "rowing unilateral",
      "rowing uni",
      "one arm row",
    ],
  },
  {
    canonical: "Rowing T-bar",
    categorie: "Tirage",
    aliases: ["rowing t-bar", "rowing t bar", "t-bar row", "t bar row"],
  },
  {
    canonical: "Rowing machine",
    categorie: "Tirage",
    aliases: ["rowing machine", "machine row", "hammer row"],
  },
  {
    canonical: "Shrugs",
    categorie: "Tirage",
    aliases: [
      "shrugs",
      "shrug",
      "haussements d'epaules",
      "haussements epaules",
      "haussement epaules",
    ],
  },
  {
    canonical: "Face pull",
    categorie: "Tirage",
    aliases: ["face pull", "facepull", "oiseau poulie"],
  },

  // ────────── Jambes (quadriceps, ischios, fessiers, mollets) ──────────
  {
    canonical: "Squat",
    categorie: "Jambes",
    aliases: ["squat", "back squat", "squat barre"],
  },
  {
    canonical: "Front squat",
    categorie: "Jambes",
    aliases: ["front squat", "squat avant"],
  },
  {
    canonical: "Hack squat",
    categorie: "Jambes",
    aliases: ["hack squat", "hack", "squat machine"],
  },
  {
    canonical: "Squat bulgare",
    categorie: "Jambes",
    aliases: [
      "squat bulgare",
      "bulgarian split squat",
      "fente bulgare",
    ],
  },
  {
    canonical: "Goblet squat",
    categorie: "Jambes",
    aliases: ["goblet squat", "squat goblet"],
  },
  {
    canonical: "Presse à cuisses",
    categorie: "Jambes",
    aliases: ["presse", "presse a cuisses", "leg press"],
  },
  {
    canonical: "Fentes",
    categorie: "Jambes",
    aliases: ["fentes", "fente", "lunge", "lunges", "fentes halteres"],
  },
  {
    canonical: "Fentes marchées",
    categorie: "Jambes",
    aliases: ["fentes marchees", "walking lunges"],
  },
  {
    canonical: "Leg extension",
    categorie: "Jambes",
    aliases: ["leg extension", "extension", "quadriceps machine"],
  },
  {
    canonical: "Leg curl allongé",
    categorie: "Jambes",
    aliases: [
      "leg curl allonge",
      "leg curl",
      "ischio machine",
      "ischio",
      "lying leg curl",
    ],
  },
  {
    canonical: "Leg curl assis",
    categorie: "Jambes",
    aliases: ["leg curl assis", "seated leg curl"],
  },
  {
    canonical: "Hip thrust",
    categorie: "Jambes",
    aliases: ["hip thrust", "pont fessier", "glute bridge"],
  },
  {
    canonical: "Mollets debout",
    categorie: "Jambes",
    aliases: [
      "mollets",
      "mollets debout",
      "calf",
      "standing calf raise",
      "calf raise",
    ],
  },
  {
    canonical: "Mollets assis",
    categorie: "Jambes",
    aliases: ["mollets assis", "seated calf", "seated calf raise"],
  },

  // ────────── Épaules (deltoïdes) ──────────
  {
    canonical: "Développé militaire",
    categorie: "Épaules",
    aliases: [
      "ohp",
      "developpe militaire",
      "developpe militaire barre",
      "dm",
      "dm barre",
      "overhead press",
      "military press",
      "dev militaire",
    ],
  },
  {
    canonical: "Développé militaire haltères",
    categorie: "Épaules",
    aliases: [
      "developpe militaire halteres",
      "developpe militaire haltere",
      "dm halteres",
      "dm haltere",
      "shoulder press",
      "db shoulder press",
      "dumbbell shoulder press",
    ],
  },
  {
    canonical: "Développé militaire machine",
    categorie: "Épaules",
    aliases: [
      "developpe militaire machine",
      "dm machine",
      "machine shoulder press",
      "shoulder press machine",
    ],
  },
  {
    canonical: "Arnold press",
    categorie: "Épaules",
    aliases: ["arnold press", "arnold"],
  },
  {
    canonical: "Élévations latérales",
    categorie: "Épaules",
    aliases: [
      "elevations laterales",
      "elevation laterale",
      "elevations laterales halteres",
      "lateral raise",
      "db lateral raise",
    ],
  },
  {
    canonical: "Élévations latérales poulie",
    categorie: "Épaules",
    aliases: [
      "elevations poulie",
      "elevation poulie",
      "elevations laterales poulie",
      "lateral cable",
      "cable lateral raise",
    ],
  },
  {
    canonical: "Élévations latérales machine",
    categorie: "Épaules",
    aliases: [
      "elevations laterales machine",
      "machine lateral raise",
      "machine lateral",
    ],
  },
  {
    canonical: "Élévations frontales",
    categorie: "Épaules",
    aliases: [
      "elevations frontales",
      "elevation frontale",
      "front raise",
    ],
  },
  {
    canonical: "Oiseau haltères",
    categorie: "Épaules",
    aliases: [
      "oiseau",
      "oiseau halteres",
      "rear delt fly",
      "reverse fly",
      "bent over lateral",
    ],
  },
  {
    canonical: "Oiseau machine",
    categorie: "Épaules",
    aliases: [
      "oiseau machine",
      "rear delt machine",
      "reverse pec deck",
    ],
  },

  // ────────── Bras (biceps, triceps) ──────────
  {
    canonical: "Curl barre",
    categorie: "Bras",
    aliases: ["curl barre", "bb curl", "barbell curl", "curl ez"],
  },
  {
    canonical: "Curl haltères",
    categorie: "Bras",
    aliases: [
      "curl",
      "curl biceps",
      "curl halteres",
      "curl haltere",
      "biceps curl",
      "db curl",
      "dumbbell curl",
    ],
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
      "curl incline halteres",
      "incline curl",
      "curl banc incline",
      "curl 45",
    ],
  },
  {
    canonical: "Curl pupitre",
    categorie: "Bras",
    aliases: [
      "curl pupitre",
      "curl larry scott",
      "preacher curl",
      "scott curl",
    ],
  },
  {
    canonical: "Curl poulie",
    categorie: "Bras",
    aliases: ["curl poulie", "cable curl"],
  },
  {
    canonical: "Curl concentration",
    categorie: "Bras",
    aliases: ["curl concentration", "concentration curl"],
  },
  {
    canonical: "Pushdown",
    categorie: "Bras",
    aliases: ["pushdown", "triceps pushdown", "poulie triceps"],
  },
  {
    canonical: "Extension triceps poulie",
    categorie: "Bras",
    aliases: [
      "extension triceps poulie",
      "extension poulie",
      "triceps poulie barre",
      "cable triceps extension",
    ],
  },
  {
    canonical: "Pushdown corde",
    categorie: "Bras",
    aliases: ["pushdown corde", "rope pushdown", "triceps corde"],
  },
  {
    canonical: "Extension triceps barre",
    categorie: "Bras",
    aliases: [
      "extension triceps",
      "extension triceps barre",
      "skull crusher",
      "barre au front",
    ],
  },
  {
    canonical: "French press",
    categorie: "Bras",
    aliases: [
      "french press",
      "french press poulie",
      "french press haltere",
      "barre au front poulie",
      "overhead triceps",
    ],
  },
  {
    canonical: "Kickback triceps",
    categorie: "Bras",
    aliases: ["kickback", "kickback triceps", "triceps kickback"],
  },
  {
    canonical: "Dips banc",
    categorie: "Bras",
    aliases: ["dips banc", "bench dips", "dips chaise"],
  },

  // ────────── Abdos (sangle abdominale) ──────────
  {
    canonical: "Crunch",
    categorie: "Abdos",
    aliases: ["crunch", "crunchs"],
  },
  {
    canonical: "Crunch machine",
    categorie: "Abdos",
    aliases: ["crunch machine", "ab machine", "machine abdos"],
  },
  {
    canonical: "Relevé de jambes",
    categorie: "Abdos",
    aliases: [
      "releve de jambes",
      "relevees de jambes",
      "leg raise",
      "hanging leg raise",
    ],
  },
  {
    canonical: "Gainage",
    categorie: "Abdos",
    aliases: ["gainage", "plank", "planche"],
  },
  {
    canonical: "Roue abdominale",
    categorie: "Abdos",
    aliases: ["roue abdominale", "ab wheel", "ab roller"],
  },
  {
    canonical: "Russian twist",
    categorie: "Abdos",
    aliases: ["russian twist", "twist russe"],
  },
  {
    canonical: "Crunch poulie",
    categorie: "Abdos",
    aliases: ["crunch poulie", "cable crunch"],
  },

  // ────────── Cardio ──────────
  {
    canonical: "Course",
    categorie: "Cardio",
    aliases: ["course", "running", "run", "tapis"],
  },
  {
    canonical: "Vélo",
    categorie: "Cardio",
    aliases: ["velo", "bike", "cyclisme"],
  },
  {
    canonical: "Rameur",
    categorie: "Cardio",
    aliases: ["rameur", "rowing ergo", "rower"],
  },
  {
    canonical: "Corde à sauter",
    categorie: "Cardio",
    aliases: ["corde a sauter", "jump rope"],
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
    for (const alias of [def.canonical, ...def.aliases]) {
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

// Renvoie les exercices regroupés par catégorie, dans l'ordre du catalogue.
export function exercisesByCategory(): Record<Category, ExerciseDef[]> {
  const out = {} as Record<Category, ExerciseDef[]>;
  for (const def of EXERCISE_CATALOG) {
    if (!out[def.categorie]) out[def.categorie] = [];
    out[def.categorie].push(def);
  }
  return out;
}
