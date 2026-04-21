import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProgramExercise, ProgramTemplate } from "../data/programs";
import { ALL_CATEGORIES, type Category } from "../types";

interface Props {
  initial?: ProgramTemplate;
  onSave: (p: ProgramTemplate) => void;
  onClose: () => void;
  onDelete?: () => void;
}

// Modal CRUD pour un programme personnalisé. Champs obligatoires : nom
// + au moins un exercice. Persiste via usePrograms (qui synchronise Supabase
// pour les utilisateurs connectés et LocalStorage sinon).
export function ProgramEditor({ initial, onSave, onClose, onDelete }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [exercises, setExercises] = useState<ProgramExercise[]>(
    () => initial?.exercises.map((e) => ({ ...e })) ?? [emptyExercise()],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function update(i: number, patch: Partial<ProgramExercise>) {
    setExercises((arr) =>
      arr.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
    );
  }

  function remove(i: number) {
    setExercises((arr) => arr.filter((_, idx) => idx !== i));
  }

  function add() {
    setExercises((arr) => [...arr, emptyExercise()]);
  }

  function handleSave() {
    const clean = exercises
      .map((e) => ({
        ...e,
        nom: e.nom.trim(),
        repsTarget: e.repsTarget.trim() || "10",
        poidsTarget: e.poidsTarget?.trim() || undefined,
        objectif: e.objectif?.trim() || undefined,
        cues: e.cues?.map((c) => c.trim()).filter(Boolean),
      }))
      .filter((e) => e.nom);
    if (!nom.trim() || clean.length === 0) return;
    onSave({
      id: initial?.id ?? `custom-${Date.now()}`,
      nom: nom.trim(),
      description: description.trim() || undefined,
      exercises: clean,
    });
  }

  const isNew = !initial;

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
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-bg-card z-10">
          <h3 className="font-semibold">
            {isNew ? "Nouveau programme" : `Modifier — ${initial?.nom}`}
          </h3>
          <button
            className="btn-ghost !p-1.5"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Field label="Nom de la séance">
            <input
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: PUSH, UPPER A, Full body…"
            />
          </Field>
          <Field label="Description (optionnel)">
            <textarea
              className="input min-h-[60px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectif de la séance, rotation, matériel requis…"
            />
          </Field>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-muted uppercase tracking-wide">
                Exercices ({exercises.length})
              </span>
              <button
                className="btn-ghost !py-1 text-xs"
                onClick={add}
                type="button"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map((ex, i) => (
                <ExerciseRow
                  key={i}
                  exercise={ex}
                  onChange={(patch) => update(i, patch)}
                  onRemove={exercises.length > 1 ? () => remove(i) : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border sticky bottom-0 bg-bg-card">
          {!isNew && onDelete ? (
            <button
              className="btn-ghost text-rose-400 hover:text-rose-300"
              onClick={() => {
                if (confirm("Supprimer ce programme ?")) onDelete();
              }}
            >
              Supprimer
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={
                !nom.trim() || !exercises.some((e) => e.nom.trim())
              }
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseRow({
  exercise,
  onChange,
  onRemove,
}: {
  exercise: ProgramExercise;
  onChange: (patch: Partial<ProgramExercise>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="bg-bg-soft border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          className="input flex-1"
          value={exercise.nom}
          onChange={(e) => onChange({ nom: e.target.value })}
          placeholder="Nom de l'exercice"
        />
        <select
          className="input !w-auto !py-1.5 text-xs"
          value={exercise.categorie}
          onChange={(e) => onChange({ categorie: e.target.value as Category })}
        >
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {onRemove && (
          <button
            className="btn-ghost !p-1.5 text-rose-400"
            onClick={onRemove}
            type="button"
            aria-label="Retirer l'exercice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Séries">
          <input
            className="input"
            inputMode="numeric"
            value={exercise.sets}
            onChange={(e) =>
              onChange({ sets: Math.max(1, parseInt(e.target.value, 10) || 1) })
            }
          />
        </Field>
        <Field label="Reps cible">
          <input
            className="input"
            value={exercise.repsTarget}
            onChange={(e) => onChange({ repsTarget: e.target.value })}
            placeholder="8 ou 12-10-8"
          />
        </Field>
        <Field label="Poids cible">
          <input
            className="input"
            value={exercise.poidsTarget ?? ""}
            onChange={(e) => onChange({ poidsTarget: e.target.value })}
            placeholder="80kg, PDC, +20kg…"
          />
        </Field>
      </div>
      <Field label="Objectif (optionnel)">
        <input
          className="input"
          value={exercise.objectif ?? ""}
          onChange={(e) => onChange({ objectif: e.target.value })}
          placeholder="3×8 à 80 kg propre"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-text-muted uppercase tracking-wide mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}

function emptyExercise(): ProgramExercise {
  return {
    nom: "",
    categorie: "Autre",
    sets: 3,
    repsTarget: "10",
  };
}
