// Parser de séance via Mistral. L'utilisateur décrit sa séance en langage
// naturel, l'IA renvoie un JSON structuré d'ExerciseEntry[]. Le parser regex
// classique (parser.ts) sert de fallback quand le LLM est indisponible.

import type { ExerciseEntry, Category } from "../types";
import { chatCompletion, getLLMConfig } from "./llm";
import { ALL_CATEGORIES } from "../types";

export function isAIParserAvailable(): boolean {
  return getLLMConfig() !== null;
}

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de séances de musculation / fitness.
L'utilisateur décrit sa séance en français (parfois mélangé avec de l'anglais).
Tu dois extraire CHAQUE exercice mentionné et retourner un tableau JSON.

Catégories possibles : ${ALL_CATEGORIES.join(", ")}.

Format de sortie STRICT (rien d'autre que le JSON, pas de markdown, pas de commentaire) :
[
  {
    "nom": "Nom canonique de l'exercice en français",
    "categorie": "Catégorie parmi la liste ci-dessus",
    "sets": [
      { "reps": 12, "poids": 80 },
      { "reps": 12, "poids": 80 }
    ]
  }
]

Règles :
- "poids" est en kg. Si l'utilisateur ne précise pas de poids ou dit "poids de corps" / "PDC", mets poids à 0.
- Si l'utilisateur dit "3x12 à 80kg", crée 3 objets set identiques { reps: 12, poids: 80 }.
- Si pyramidal ou dégressive (ex: "80/90/100 pour 8 reps"), crée un set par palier.
- Utilise les noms canoniques français : "Développé couché" (pas "DC"), "Squat" (pas "back squat"), "Tractions" (pas "pull-ups"), etc.
- Exercices cardio : sets vide [], ajoute un champ "cardio" avec distance (km), duree (min), denivele (m) si mentionnés.
- Si tu ne reconnais pas un exercice, devine au mieux la catégorie et garde le nom donné par l'utilisateur.
- Renvoie UNIQUEMENT le tableau JSON. Aucun texte autour.`;

export interface AIParseResult {
  exercices: ExerciseEntry[];
  raw: string;
}

export async function aiParseSession(
  input: string,
  signal?: AbortSignal,
): Promise<AIParseResult> {
  const raw = await chatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: input },
    ],
    { temperature: 0.1, maxTokens: 2000, signal },
  );

  // Extraire le JSON du texte (au cas où le modèle ajoute du markdown).
  const jsonStr = extractJSON(raw);
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error("Le LLM n'a pas renvoyé un tableau JSON");
  }

  const exercices: ExerciseEntry[] = parsed.map((item: Record<string, unknown>) => ({
    nom: String(item.nom ?? "Inconnu"),
    categorie: validCategory(item.categorie),
    sets: Array.isArray(item.sets)
      ? item.sets.map((s: Record<string, unknown>) => ({
          reps: Number(s.reps ?? 0),
          poids: Number(s.poids ?? 0),
        }))
      : [],
    ...(item.cardio ? { cardio: item.cardio as ExerciseEntry["cardio"] } : {}),
  }));

  return { exercices, raw };
}

function validCategory(val: unknown): Category {
  if (typeof val === "string" && ALL_CATEGORIES.includes(val as Category)) {
    return val as Category;
  }
  return "Autre";
}

function extractJSON(text: string): string {
  // Retire les blocs ```json ... ``` si présents.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Sinon, cherche le premier [ ... ] ou { ... }.
  const bracket = text.match(/\[[\s\S]*\]/);
  if (bracket) return bracket[0];
  return text.trim();
}
