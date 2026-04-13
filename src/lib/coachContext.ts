import type { ProgramTemplate } from "../data/programs";
import type { BodyWeightEntry, PersonalRecordOverride, Session } from "../types";
import { computeRecords, type PersonalRecord } from "./records";
import { exerciseVolume, sessionVolume } from "./scoring";

// Construit un bloc de contexte texte que le LLM ingère en system prompt.
// On reste compact : top-N séances récentes + agrégats, pas le dump complet
// pour rester sous la fenêtre de contexte du modèle.
export function buildCoachContext(args: {
  sessions: Session[];
  bodyWeights: BodyWeightEntry[];
  overrides: PersonalRecordOverride[];
  programs: ProgramTemplate[];
  recentSessionsCount?: number;
}): string {
  const recentN = args.recentSessionsCount ?? 8;
  const sortedSessions = [...args.sessions].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );
  const recent = sortedSessions.slice(0, recentN);
  const records = computeRecords(args.sessions, args.overrides);
  const sortedBw = [...args.bodyWeights].sort((a, b) =>
    a.date < b.date ? 1 : -1,
  );

  return [
    "## Profil utilisateur",
    formatBodyWeight(sortedBw),
    "",
    "## Records personnels actuels (top 12 par 1RM estimé)",
    formatRecords(records.slice(0, 12)),
    "",
    `## ${recent.length} séances les plus récentes`,
    formatSessions(recent),
    "",
    `## Statistiques globales (sur ${args.sessions.length} séances)`,
    formatGlobalStats(args.sessions),
    "",
    "## Programmes actuels",
    formatPrograms(args.programs),
  ].join("\n");
}

function formatBodyWeight(bw: BodyWeightEntry[]): string {
  if (!bw.length) return "Pas de pesée enregistrée.";
  const latest = bw[0];
  const oldest = bw[bw.length - 1];
  const delta = (latest.poids - oldest.poids).toFixed(1);
  return `Poids actuel : ${latest.poids} kg (${latest.date}). Évolution depuis ${oldest.date} : ${delta >= "0" ? "+" : ""}${delta} kg sur ${bw.length} pesées.`;
}

function formatRecords(records: PersonalRecord[]): string {
  if (!records.length) return "Aucun record calculé.";
  return records
    .map((r) => {
      const parts = [
        `- **${r.nom}** (${r.categorie})`,
        `charge max ${r.maxPoids}kg × ${r.maxPoidsReps} reps`,
        `1RM est. ${Math.round(r.best1RM)}kg`,
        `${r.totalSessions} séance${r.totalSessions > 1 ? "s" : ""}`,
      ];
      if (r.maxPoidsDate) parts.push(`dernier PR ${r.maxPoidsDate}`);
      if (r.manualOverride) parts.push("(saisie manuelle)");
      return parts.join(" · ");
    })
    .join("\n");
}

function formatSessions(sessions: Session[]): string {
  if (!sessions.length) return "Aucune séance.";
  return sessions
    .map((s) => {
      const vol = Math.round(sessionVolume(s));
      const exos = s.exercices
        .map((ex) => {
          const vol = Math.round(exerciseVolume(ex));
          if (ex.cardio) {
            const c = ex.cardio;
            const bits = [];
            if (c.distance != null) bits.push(`${c.distance}km`);
            if (c.duree != null) bits.push(`${c.duree}min`);
            if (c.denivele != null) bits.push(`+${c.denivele}m D+`);
            return `  - ${ex.nom} (cardio) ${bits.join(" · ")}`;
          }
          const sets = ex.sets
            .map((set) => `${set.reps}×${set.poids}kg`)
            .join(", ");
          return `  - ${ex.nom} : ${sets} (vol ${vol}kg)`;
        })
        .join("\n");
      return `### ${s.date} — vol ${vol}kg${s.bodyWeight ? ` · pdc ${s.bodyWeight}kg` : ""}\n${exos}${s.notes ? `\n  Notes : ${s.notes}` : ""}`;
    })
    .join("\n\n");
}

function formatGlobalStats(sessions: Session[]): string {
  const totalVol = sessions.reduce((acc, s) => acc + sessionVolume(s), 0);
  const dates = sessions.map((s) => s.date).sort();
  const span = dates.length
    ? `du ${dates[0]} au ${dates[dates.length - 1]}`
    : "—";
  return `Volume total cumulé : ${Math.round(totalVol)} kg sur ${sessions.length} séances ${span}.`;
}

function formatPrograms(programs: ProgramTemplate[]): string {
  if (!programs.length) return "Aucun programme.";
  return programs
    .map((p) => {
      const exos = p.exercises
        .map((ex) => {
          const target = ex.poidsTarget ? ` à ${ex.poidsTarget}` : "";
          const obj = ex.objectif ? ` — objectif : ${ex.objectif}` : "";
          return `  - ${ex.nom} : ${ex.sets}×${ex.repsTarget}${target}${obj}`;
        })
        .join("\n");
      return `### ${p.nom} (id: \`${p.id}\`)${p.description ? ` — ${p.description}` : ""}\n${exos}`;
    })
    .join("\n\n");
}
