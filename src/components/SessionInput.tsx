import { Sparkles, Calendar, Trash2, Plus, X, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseInput } from "../lib/parser";
import type { ExerciseEntry, Session } from "../types";

interface Props {
  onSave: (session: Omit<Session, "id">) => void;
  // Texte injecté de l'extérieur (ex: chargement d'un template programme).
  // Chaque nouvelle valeur remplace la saisie en cours.
  prefillText?: string;
  prefillVersion?: number;
  // Mode édition : renseigné → le bouton devient "Mettre à jour" et
  // onSave recevra la date/notes/bw pré-chargées.
  editing?: {
    date: string;
    notes?: string;
    bodyWeight?: number;
  };
  onCancelEdit?: () => void;
}

// Champ de saisie NLP : analyse une phrase libre et propose un aperçu
// structuré des exercices avant sauvegarde.
export function SessionInput({
  onSave,
  prefillText,
  prefillVersion,
  editing,
  onCancelEdit,
}: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (prefillText !== undefined) setText(prefillText);
    // prefillVersion permet de ré-appliquer le même texte plusieurs fois.
  }, [prefillText, prefillVersion]);

  useEffect(() => {
    if (editing) {
      setDate(editing.date);
      setNotes(editing.notes ?? "");
      setBodyWeight(editing.bodyWeight ? String(editing.bodyWeight) : "");
    }
  }, [editing]);
  const [notes, setNotes] = useState("");
  const [bodyWeight, setBodyWeight] = useState<string>("");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const parsed = useMemo(() => parseInput(text), [text]);

  const canSave = parsed.exercices.length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({
      date,
      exercices: parsed.exercices,
      notes: notes.trim() || undefined,
      bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined,
    });
    setText("");
    setNotes("");
    setBodyWeight("");
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold">
            {editing ? "Modifier la séance" : "Nouvelle séance"}
          </h2>
        </div>
        {editing && onCancelEdit && (
          <button className="btn-ghost !py-1.5" onClick={onCancelEdit}>
            <X className="w-4 h-4" /> Annuler
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex items-center gap-2 col-span-1">
          <Calendar className="w-4 h-4 text-text-muted" />
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <input
          className="input md:col-span-1"
          placeholder="Poids de corps (kg)"
          inputMode="decimal"
          value={bodyWeight}
          onChange={(e) => setBodyWeight(e.target.value)}
        />
        <input
          className="input md:col-span-1"
          placeholder="Notes (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <textarea
        className="input min-h-[110px] font-mono text-sm"
        placeholder={`Décris ta séance, une ligne par exercice. Ex:
3 séries de 12 rep de DC à 80kg
4x10 squat 100kg
curl 3x12 à 15`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <ParsedPreview exercices={parsed.exercices} unrecognized={parsed.unrecognized} />

      <div className="flex justify-end gap-2">
        <button
          className="btn-ghost"
          onClick={() => {
            setText("");
            setNotes("");
            setBodyWeight("");
          }}
        >
          <Trash2 className="w-4 h-4" /> Effacer
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
          {editing ? (
            <>
              <Save className="w-4 h-4" /> Mettre à jour
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ParsedPreview({
  exercices,
  unrecognized,
}: {
  exercices: ExerciseEntry[];
  unrecognized: string[];
}) {
  if (!exercices.length && !unrecognized.length) {
    return (
      <p className="text-xs text-text-dim">
        L'aperçu des exercices reconnus apparaîtra ici.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {exercices.map((ex, i) => (
        <div
          key={i}
          className="flex flex-wrap items-center gap-2 text-sm bg-bg-soft border border-border rounded-lg px-3 py-2"
        >
          <span className="font-medium">{ex.nom}</span>
          <span className="chip bg-accent-muted/40 text-accent-soft">
            {ex.categorie}
          </span>
          <span className="text-text-muted">
            {ex.sets.length} × {ex.sets[0].reps} reps
            {ex.sets[0].poids > 0 ? ` @ ${ex.sets[0].poids} kg` : " (PDC)"}
          </span>
        </div>
      ))}
      {unrecognized.map((seg, i) => (
        <div
          key={`u-${i}`}
          className="text-xs text-rose-500 bg-rose-100/60 border border-rose-200 rounded-lg px-3 py-2"
        >
          Non reconnu : « {seg} »
        </div>
      ))}
    </div>
  );
}
