import { Check, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import type { ProgramTemplate } from "../data/programs";
import {
  applyChanges,
  readField,
  type ProgramChange,
  type ProgramRecommendation,
} from "../lib/recommendations";

interface Props {
  recommendation: ProgramRecommendation;
  programs: ProgramTemplate[];
  onApply: (next: ProgramTemplate[]) => void;
  onClose: () => void;
}

// Présente les modifications proposées par le coach IA en diff cliquable.
// L'utilisateur coche les changements à appliquer et valide en un clic.
export function RecommendationModal({
  recommendation,
  programs,
  onApply,
  onClose,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(recommendation.shortTerm.map((_, i) => i)),
  );

  function toggle(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  function handleApply() {
    const picked = recommendation.shortTerm.filter((_, i) => selected.has(i));
    onApply(applyChanges(programs, picked));
    onClose();
  }

  const empty = recommendation.shortTerm.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-t-xl sm:rounded-xl w-full max-w-2xl max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-bg-card">
          <h3 className="font-semibold text-sm">
            Recommandations du Coach IA
          </h3>
          <button
            className="btn-ghost !p-1.5"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {recommendation.summary && (
            <div className="text-xs text-text-muted bg-bg-soft border border-border rounded-lg p-3">
              {recommendation.summary}
            </div>
          )}

          {empty ? (
            <div className="text-center text-sm text-text-dim py-6">
              Aucune modification proposée pour la semaine à venir.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-text-dim uppercase tracking-wide">
                Court terme — semaine prochaine
              </div>
              {recommendation.shortTerm.map((c, i) => (
                <ChangeRow
                  key={i}
                  change={c}
                  current={readField(
                    programs,
                    c.programId,
                    c.exerciseName,
                    c.field,
                  )}
                  selected={selected.has(i)}
                  onToggle={() => toggle(i)}
                />
              ))}
            </div>
          )}

          {recommendation.longTermNote && (
            <div className="space-y-1">
              <div className="text-xs text-text-dim uppercase tracking-wide">
                Vision long terme
              </div>
              <div className="text-xs text-text bg-accent-muted/20 border border-accent-muted/40 rounded-lg p-3">
                {recommendation.longTermNote}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border sticky bottom-0 bg-bg-card">
          <span className="text-xs text-text-dim">
            {selected.size}/{recommendation.shortTerm.length} sélectionné
            {selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-primary"
              onClick={handleApply}
              disabled={empty || selected.size === 0}
            >
              <Check className="w-4 h-4" /> Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeRow({
  change,
  current,
  selected,
  onToggle,
}: {
  change: ProgramChange;
  current: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const fieldLabel: Record<ProgramChange["field"], string> = {
    sets: "Séries",
    repsTarget: "Reps cible",
    poidsTarget: "Poids cible",
    objectif: "Objectif",
  };
  return (
    <button
      className={[
        "w-full text-left rounded-lg border p-3 transition-colors",
        selected
          ? "bg-accent-muted/30 border-accent/60"
          : "bg-bg-soft border-border hover:border-border-strong",
      ].join(" ")}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0",
            selected
              ? "bg-accent border-accent text-bg"
              : "border-border-strong",
          ].join(" ")}
        >
          {selected && <Check className="w-3 h-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{change.exerciseName}</div>
          <div className="text-[11px] text-text-dim mt-0.5">
            {change.programId} · {fieldLabel[change.field]}
          </div>
          <div className="flex items-center gap-2 text-xs mt-2 flex-wrap">
            <span className="font-mono bg-bg-elev border border-border rounded px-2 py-0.5 text-text-muted">
              {current || "—"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-text-dim shrink-0" />
            <span className="font-mono bg-accent-muted/40 border border-accent/40 rounded px-2 py-0.5 text-accent-soft">
              {change.newValue}
            </span>
          </div>
          {change.reason && (
            <div className="text-[11px] text-text-muted mt-2 italic">
              {change.reason}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
