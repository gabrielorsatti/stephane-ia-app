import { Target, Lightbulb, Copy, Pencil, Plus } from "lucide-react";
import type { ProgramExercise, ProgramTemplate } from "../data/programs";
import { useState } from "react";
import { usePrograms } from "../hooks/usePrograms";
import { ProgramEditor } from "./ProgramEditor";

interface Props {
  onFillInput?: (text: string) => void;
}

// Vue des templates de séances. Chaque exercice affiche ses cibles, son
// objectif et ses cues techniques. L'utilisateur peut créer ses propres
// programmes ou éditer/supprimer les existants (synchronisé côté cloud
// via usePrograms).
export function ProgramView({ onFillInput }: Props) {
  const { programs, upsertProgram, replaceAll } = usePrograms();
  const [activeId, setActiveId] = useState<string>(programs[0]?.id ?? "");
  const [editing, setEditing] = useState<ProgramTemplate | null | "new">(null);
  const active =
    programs.find((p) => p.id === activeId) ?? programs[0];

  function handleSave(p: ProgramTemplate) {
    upsertProgram(p);
    setActiveId(p.id);
    setEditing(null);
  }

  function handleDelete(id: string) {
    replaceAll(programs.filter((p) => p.id !== id));
    setEditing(null);
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Programmes</h2>
          </div>
          <button
            className="btn-ghost !py-1.5 text-xs"
            onClick={() => setEditing("new")}
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </div>
        {programs.length === 0 ? (
          <div className="text-sm text-text-dim py-4 text-center">
            Aucun programme défini. Clique sur <strong>Nouveau</strong> pour en
            créer un, ou demande à Stéphane d'en générer un.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  p.id === activeId
                    ? "bg-accent text-bg"
                    : "bg-bg-soft border border-border text-text-muted hover:text-text",
                ].join(" ")}
              >
                {p.nom}
              </button>
            ))}
          </div>
        )}
        {active?.description && (
          <p className="text-xs text-text-muted mt-3">{active.description}</p>
        )}
      </div>

      {active && (
        <>
          <div className="flex justify-end">
            <button
              className="btn-ghost !py-1.5 text-xs"
              onClick={() => setEditing(active)}
            >
              <Pencil className="w-3.5 h-3.5" /> Éditer ce programme
            </button>
          </div>

          <div className="space-y-3">
            {active.exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                onCopy={
                  onFillInput
                    ? () => onFillInput(exerciseToNlp(ex))
                    : undefined
                }
              />
            ))}
          </div>

          {onFillInput && (
            <div className="flex justify-end">
              <button
                className="btn-primary"
                onClick={() => onFillInput(programToNlp(active))}
              >
                <Copy className="w-4 h-4" /> Charger la séance complète
              </button>
            </div>
          )}
        </>
      )}

      {editing && (
        <ProgramEditor
          initial={editing === "new" ? undefined : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          onDelete={
            editing !== "new" ? () => handleDelete(editing.id) : undefined
          }
        />
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  onCopy,
}: {
  exercise: ProgramExercise;
  onCopy?: () => void;
}) {
  return (
    <div className="card-elev space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold">{exercise.nom}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {exercise.sets} × {exercise.repsTarget}
            {exercise.poidsTarget ? ` · ${exercise.poidsTarget}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-accent-muted/40 text-accent-soft">
            {exercise.categorie}
          </span>
          {onCopy && (
            <button
              className="btn-ghost !p-1.5"
              onClick={onCopy}
              title="Copier dans la saisie NLP"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {exercise.objectif && (
        <div className="flex items-start gap-2 text-xs text-accent-soft bg-accent-muted/20 border border-accent-muted/40 rounded-lg px-3 py-2">
          <Target className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">Objectif :</strong>{" "}
            {exercise.objectif}
          </span>
        </div>
      )}
      {exercise.cues && exercise.cues.length > 0 && (
        <ul className="space-y-1">
          {exercise.cues.map((c, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-text-muted"
            >
              <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-soft" />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Convertit un exercice du template en ligne NLP saisissable.
function exerciseToNlp(ex: ProgramExercise): string {
  const reps = parseFirstInt(ex.repsTarget) ?? 10;
  const poids = parseFirstInt(ex.poidsTarget ?? "");
  return poids
    ? `${ex.sets}x${reps} ${ex.nom} à ${poids}kg`
    : `${ex.sets}x${reps} ${ex.nom}`;
}

function programToNlp(p: ProgramTemplate): string {
  return p.exercises.map(exerciseToNlp).join("\n");
}

function parseFirstInt(s: string): number | null {
  const m = s.match(/(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}
