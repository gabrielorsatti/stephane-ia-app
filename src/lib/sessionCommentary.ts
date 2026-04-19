import type { Session } from "../types";
import type { ProgramTemplate } from "../data/programs";
import { chatCompletionWithUsage, getLLMConfig, type ChatMessage } from "./llm";
import { logUsage } from "./usageLogger";
import { sessionVolume, exerciseVolume } from "./scoring";

const COMMENTARY_SYSTEM = `Tu es un coach de musculation expert. On te donne le détail d'une séance que l'utilisateur vient de terminer.

Génère un bilan de séance en EXACTEMENT 80-120 mots. Ton : naturel, encourageant mais critique et honnête.

Analyse obligatoirement :
- L'ordre des exercices (logique ou non)
- Le volume global (suffisant, excessif, insuffisant par rapport à un entraînement standard)
- La cohérence des charges/reps
- Un conseil concret pour la prochaine séance

Format : un seul paragraphe fluide, PAS de bullet points, PAS de titres. Commence directement par l'analyse, pas par « Bilan : ».`;

function formatSessionForPrompt(session: Session, programs: ProgramTemplate[]): string {
  const vol = Math.round(sessionVolume(session));
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

  return `Séance du ${session.date} — volume total ${vol}kg${session.bodyWeight ? ` — PDC ${session.bodyWeight}kg` : ""}${session.notes ? ` — notes : ${session.notes}` : ""}\n\n${exos}${programCtx}`;
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
