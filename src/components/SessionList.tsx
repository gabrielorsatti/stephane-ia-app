import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Brain, Dumbbell, Pencil, Trash2 } from "lucide-react";
import type { Session } from "../types";
import { groupExercises } from "../lib/groupExercises";
import { sessionScore, sessionVolume } from "../lib/scoring";
import { EmptyState } from "./EmptyState";

interface Props {
  sessions: Session[];
  onRemove: (id: string) => void;
  onEdit?: (session: Session) => void;
}

// Historique des séances, les plus récentes en premier.
export function SessionList({ sessions, onRemove, onEdit }: Props) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Aucune séance enregistrée"
        description="C'est le moment de s'y mettre ! Enregistre ta première séance depuis l'onglet Training."
      />
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <SessionCard
          key={s.id}
          session={s}
          onRemove={() => onRemove(s.id)}
          onEdit={onEdit ? () => onEdit(s) : undefined}
        />
      ))}
    </div>
  );
}

function SessionCard({
  session,
  onRemove,
  onEdit,
}: {
  session: Session;
  onRemove: () => void;
  onEdit?: () => void;
}) {
  const vol = Math.round(sessionVolume(session));
  const score = sessionScore(session);

  return (
    <div className="card-elev space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">
            {format(parseISO(session.date), "EEEE d MMMM yyyy", { locale: fr })}
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {session.exercices.length} exercices
            {vol > 0 ? ` · ${vol} kg` : ""}
            {` · ${score} XP`}
            {session.bodyWeight ? ` · PDC ${session.bodyWeight}kg` : ""}
          </div>
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button
              className="btn-ghost !p-2"
              onClick={onEdit}
              aria-label="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button
            className="btn-ghost !p-2"
            onClick={onRemove}
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {groupExercises(session.exercices).map((ex, i) => (
          <div
            key={i}
            className="bg-bg-soft border border-border rounded-lg px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">{ex.nom}</span>
              <span className="chip bg-accent-muted/40 text-accent-soft shrink-0">
                {ex.categorie}
              </span>
            </div>
            <div className="text-xs text-text-muted">
              {ex.durationMinutes
                ? `${ex.durationMinutes} min${ex.intensity ? ` · ${ex.intensity}` : ""}`
                : ex.sets.map((s) => `${s.reps}×${s.poids || "PDC"}`).join(" · ")}
            </div>
          </div>
        ))}
      </div>
      {session.notes && (
        <div className="text-xs text-text-muted italic">« {session.notes} »</div>
      )}
      {session.coachCommentary && (
        <div className="bg-accent-muted/20 border border-accent-muted rounded-xl px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-1.5 text-accent-soft text-[11px] font-semibold uppercase tracking-wide">
            <Brain className="w-3.5 h-3.5" />
            L'avis de Stéphane
          </div>
          <p className="text-[10px] text-text-dim mb-1">Votre coach personnel propulsé par l'IA</p>
          <p className="text-xs text-text-muted italic leading-relaxed">
            {session.coachCommentary}
          </p>
        </div>
      )}
    </div>
  );
}
