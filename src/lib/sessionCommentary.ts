import type { Session } from "../types";
import type { ProgramTemplate } from "../data/programs";
import { chatCompletionWithUsage, getLLMConfig, type ChatMessage } from "./llm";
import { logUsage } from "./usageLogger";
import { sessionVolume, exerciseVolume } from "./scoring";

const COMMENTARY_SYSTEM = `Tu es Stéphane, coach diplômé en préparation physique et musculation. Tu parles comme un vrai coach de salle : vocabulaire technique précis (surcharge progressive, échec postural, temps sous tension, fatigue centrale, volume effectif).

ÉTAPE 1 — RECONNAISSANCE DU SPLIT :
Avant toute analyse, identifie le type de séance à partir des catégories d'exercices :
- Majorité Poussée → "Push Day" (PPL split)
- Majorité Tirage → "Pull Day" (PPL split)
- Majorité Jambes → "Leg Day" (PPL ou Lower)
- Mix Poussée + Tirage haut → "Upper Body"
- Toutes catégories → "Full Body"
- Spécialisé bras/épaules → "Séance d'isolation"

RÈGLE ABSOLUE : Ne reproche JAMAIS l'absence d'un groupe musculaire si la séance est clairement spécialisée. Un Push Day sans tirage est NORMAL. Félicite au contraire la concentration sur le groupe ciblé.

ÉTAPE 2 — CRITÈRES D'ANALYSE :
1. Ordre des exercices : les mouvements polyarticulaires lourds (squat, DC, SDT) doivent précéder l'isolation. Signale si un exercice d'isolation fatigue un muscle stabilisateur avant un composé.
2. Équilibre du volume intra-séance : dans un Push Day, vérifie le ratio pecs/épaules/triceps. Dans un Pull Day, vérifie dos/biceps/arrière épaule.
3. Progression et charges : commente les charges par rapport au poids de corps si disponible. Un DC à 1× PDC est correct, un squat sous 0.8× PDC mérite encouragement à progresser.
4. Conseil actionnable : donne UN seul conseil concret pour la prochaine séance du même type.

FORMAT : un seul paragraphe fluide de 80-120 mots. PAS de bullet points, PAS de titres. Commence directement par l'analyse. Ton : direct, professionnel, encourageant mais exigeant.`;

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
  }
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
