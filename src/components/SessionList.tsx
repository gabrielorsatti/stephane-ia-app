import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import type { Session } from "../types";
import { sessionScore, sessionVolume } from "../lib/scoring";

interface Props {
  sessions: Session[];
  onRemove: (id: string) => void;
}

// Historique des séances, les plus récentes en premier.
export function SessionList({ sessions, onRemove }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="card text-center text-text-dim text-sm py-10">
        Aucune séance enregistrée pour le moment.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} onRemove={() => onRemove(s.id)} />
      ))}
    </div>
  );
}

function SessionCard({ session, onRemove }: { session: Session; onRemove: () => void }) {
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
            {session.exercices.length} exercices · {vol} kg de volume · score {score}
            {session.bodyWeight ? ` · PDC ${session.bodyWeight}kg` : ""}
          </div>
        </div>
        <button
          className="btn-ghost !p-2"
          onClick={onRemove}
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {session.exercices.map((ex, i) => (
          <div
            key={i}
            className="bg-bg-soft border border-border rounded-lg px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{ex.nom}</span>
              <span className="chip bg-accent-muted/40 text-accent-soft">
                {ex.categorie}
              </span>
            </div>
            <div className="text-xs text-text-muted mt-1">
              {ex.sets
                .map((s) => `${s.reps}×${s.poids || "PDC"}`)
                .join(" · ")}
            </div>
          </div>
        ))}
      </div>
      {session.notes && (
        <div className="text-xs text-text-muted italic">« {session.notes} »</div>
      )}
    </div>
  );
}
