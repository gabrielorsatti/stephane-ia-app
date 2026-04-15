import { chatCompletion } from "./llm";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const SYSTEM_PROMPT = `Tu es un expert en nutrition. Analyse la phrase de l'utilisateur et estime les valeurs nutritionnelles totales du repas (kcal, protéines g, glucides g, lipides g). Si les quantités ne sont pas précisées, utilise des portions standards. Réponds EXCLUSIVEMENT en JSON, sans texte autour, au format: {"calories": number, "protein": number, "carbs": number, "fat": number}. Aucune unité, que des nombres.`;

// Extrait le premier bloc JSON {...} d'une chaîne (tolère un préambule).
function extractJson(raw: string): string | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return trimmed.slice(start, end + 1);
}

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Estime les macros d'un repas décrit en langage naturel. Jette une Error
// si l'IA est indisponible ou renvoie un JSON invalide — l'UI décide alors
// de proposer une saisie manuelle.
export async function parseNutritionWithAI(text: string): Promise<Macros> {
  const raw = await chatCompletion(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    { temperature: 0.2, maxTokens: 200 },
  );
  const jsonStr = extractJson(raw);
  if (!jsonStr) {
    throw new Error(`Réponse IA sans JSON exploitable : ${raw.slice(0, 120)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`JSON nutrition invalide : ${jsonStr.slice(0, 120)}`);
  }
  const o = parsed as Record<string, unknown>;
  return {
    calories: Math.round(toNum(o.calories)),
    protein: toNum(o.protein),
    carbs: toNum(o.carbs),
    fat: toNum(o.fat),
  };
}
