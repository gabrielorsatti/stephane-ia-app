import type { Session } from "../types";
import type { ProgramTemplate } from "../data/programs";
import { chatCompletionWithUsage, getLLMConfig, type ChatMessage } from "./llm";
import { logUsage } from "./usageLogger";
import { sessionVolume, exerciseVolume } from "./scoring";

const COMMENTARY_SYSTEM = `Tu es Stéphane, coach diplômé en préparation physique, musculation et bien-être. Tu adaptes ton discours au TYPE de séance détecté.

═══ MODE MUSCULATION (Poussée, Tirage, Jambes, Épaules, Bras, Abdos) ═══

Vocabulaire technique : surcharge progressive, échec postural, temps sous tension, fatigue centrale, volume effectif.

ÉTAPE 1 — RECONNAISSANCE DU SPLIT :
- Majorité Poussée → "Push Day" (PPL split)
- Majorité Tirage → "Pull Day" (PPL split)
- Majorité Jambes → "Leg Day"
- Mix Poussée + Tirage haut → "Upper Body"
- Toutes catégories → "Full Body"
- Spécialisé bras/épaules → "Séance d'isolation"

RÈGLE ABSOLUE : Ne reproche JAMAIS l'absence d'un groupe musculaire si la séance est clairement spécialisée.

ÉTAPE 2 — CRITÈRES :
1. Ordre des exercices : polyarticulaires avant isolation.
2. Équilibre du volume intra-séance.
3. Charges vs poids de corps si disponible.
4. UN conseil concret pour la prochaine séance.

Ton : direct, professionnel, encourageant mais exigeant.

═══ MODE BIEN-ÊTRE (Cours Collectif, Mobilité, Cardio pur) ═══

Si la séance est de type "Cours Collectif", "Mobilité", "Yoga", "Pilates", "Cardio" ou similaire, change COMPLÈTEMENT de registre :

- Ne parle PAS de surcharge progressive, de charges ou de PR.
- Félicite la régularité et le fait d'avoir pris du temps pour soi.
- Parle de bien-être articulaire, santé globale, mobilité, souplesse, équilibre, santé cardiovasculaire.
- Commente la durée et l'intensité choisie (trop / bien dosé / pourrait augmenter).
- Encourage la fréquence : "2-3 séances par semaine pour des bénéfices durables".
- Conseil orienté récupération, hydratation, sommeil ou complémentarité (ex: "ajouter du renforcement doux").

Ton : bienveillant, chaleureux, inclusif. Pas de jargon de salle de musculation.

═══ FORMAT (les deux modes) ═══
Un seul paragraphe fluide de 80-120 mots. PAS de bullet points, PAS de titres. Commence directement par l'analyse.`;

function detectSplit(session: Session): string {
  const counts: Record<string, number> = {};
  for (const ex of session.exercices) {
    counts[ex.categorie] = (counts[ex.categorie] ?? 0) + 1;
  }
  const total = session.exercices.length;
  if (!total) return "Indéterminé";
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topCat = dominant[0][0];
  const topRatio = dominant[0][1] / total;

  if (topRatio >= 0.6) {
    if (topCat === "Poussée") return "Push Day (PPL)";
    if (topCat === "Tirage") return "Pull Day (PPL)";
    if (topCat === "Jambes") return "Leg Day";
    if (topCat === "Épaules") return "Séance Épaules";
    if (topCat === "Bras") return "Séance Bras (isolation)";
    if (topCat === "Cardio") return "Séance Cardio";
    if (topCat === "Abdos") return "Séance Core";
    if (topCat === "Cours Collectif") return "Cours Collectif (Bien-être)";
    if (topCat === "Mobilité") return "Mobilité & Santé";
  }
  const wellness = (counts["Cours Collectif"] ?? 0) + (counts["Mobilité"] ?? 0);
  if (wellness / total >= 0.5) return "Séance Bien-être";
  const hasUpper = (counts["Poussée"] ?? 0) + (counts["Tirage"] ?? 0) + (counts["Épaules"] ?? 0) + (counts["Bras"] ?? 0);
  if (hasUpper / total >= 0.8) return "Upper Body";
  if ((counts["Jambes"] ?? 0) / total >= 0.5) return "Lower Body";
  return "Full Body";
}

function formatSessionForPrompt(session: Session, programs: ProgramTemplate[]): string {
  const vol = Math.round(sessionVolume(session));
  const split = detectSplit(session);
  const exos = session.exercices
    .map((ex) => {
      if (ex.durationMinutes) {
        const intensity = ex.intensity ? ` — intensité : ${ex.intensity}` : "";
        return `- ${ex.nom} (${ex.categorie}) : ${ex.durationMinutes} min${intensity}`;
      }
      const v = Math.round(exerciseVolume(ex));
      const sets = ex.sets.map((s) => `${s.reps}×${s.poids}kg`).join(", ");
      return `- ${ex.nom} (${ex.categorie}) : ${sets} — vol ${v}kg`;
    })
    .join("\n");

  const programCtx = programs.length > 0
    ? `\n\nProgrammes actifs : ${programs.map((p) => p.nom).join(", ")}`
    : "";

  return `Séance du ${session.date} — Type détecté : ${split} — volume total ${vol}kg${session.bodyWeight ? ` — PDC ${session.bodyWeight}kg` : ""}${session.notes ? ` — notes : ${session.notes}` : ""}\n\n${exos}${programCtx}`;
}

export async function generateSessionCommentary(
  session: Session,
  programs: ProgramTemplate[],
  userId?: string,
): Promise<string | null> {
  const config = getLLMConfig();
  if (!config) return null;
  if (session.exercices.length === 0) return null;

  const messages: ChatMessage[] = [
    { role: "system", content: COMMENTARY_SYSTEM },
    { role: "user", content: formatSessionForPrompt(session, programs) },
  ];

  try {
    const result = await chatCompletionWithUsage(messages, {
      temperature: 0.5,
      maxTokens: 300,
    });
    if (userId) void logUsage(userId, result.usage);
    return result.content.trim();
  } catch {
    return null;
  }
}
