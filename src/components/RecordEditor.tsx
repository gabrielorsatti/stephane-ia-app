import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ALL_CATEGORIES, type Category, type PersonalRecordOverride } from "../types";

interface Props {
  initial?: Partial<PersonalRecordOverride>;
  onSave: (override: PersonalRecordOverride) => void;
  onClose: () => void;
  onDelete?: () => void;
}

// Modal d'édition d'un PR manuel. Champs tous optionnels sauf le nom.
export function RecordEditor({ initial, onSave, onClose, onDelete }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [categorie, setCategorie] = useState<Category>(
    (initial?.categorie as Category) ?? "Autre",
  );
  const [maxPoids, setMaxPoids] = useState(
    initial?.maxPoids != null ? String(initial.maxPoids) : "",
  );
  const [maxPoidsReps, setMaxPoidsReps] = useState(
    initial?.maxPoidsReps != null ? String(initial.maxPoidsReps) : "",
  );
  const [maxPoidsDate, setMaxPoidsDate] = useState(initial?.maxPoidsDate ?? "");
  const [best1RM, setBest1RM] = useState(
    initial?.best1RM != null ? String(initial.best1RM) : "",
  );
  const [best1RMDate, setBest1RMDate] = useState(initial?.best1RMDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSave() {
    if (!nom.trim()) return;
    const num = (s: string) => (s.trim() ? parseFloat(s.replace(",", ".")) : undefined);
    onSave({
      nom: nom.trim(),
      categorie,
      maxPoids: num(maxPoids),
      maxPoidsReps: num(maxPoidsReps),
      maxPoidsDate: maxPoidsDate || undefined,
      best1RM: num(best1RM),
      best1RMDate: best1RMDate || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const isNew = !initial?.nom;

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
        className="bg-bg-card border border-border rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">
            {isNew ? "Nouveau PR manuel" : `Modifier — ${initial?.nom}`}
          </h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Field label="Exercice">
            <input
              className="input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: Développé couché"
              disabled={!isNew}
            />
          </Field>
          <Field label="Catégorie">
            <select
              className="input"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value as Category)}
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Intensité de travail (kg)">
              <input
                className="input"
                inputMode="decimal"
                value={maxPoids}
                onChange={(e) => setMaxPoids(e.target.value)}
                placeholder="Détectée ou manuelle"
              />
            </Field>
            <Field label="Reps associées">
              <input
                className="input"
                inputMode="numeric"
                value={maxPoidsReps}
                onChange={(e) => setMaxPoidsReps(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Date de l'intensité">
            <input
              type="date"
              className="input"
              value={maxPoidsDate}
              onChange={(e) => setMaxPoidsDate(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="1RM max (kg)">
              <input
                className="input"
                inputMode="decimal"
                value={best1RM}
                onChange={(e) => setBest1RM(e.target.value)}
                placeholder="Calculé ou saisi"
              />
            </Field>
            <Field label="Date du 1RM">
              <input
                type="date"
                className="input"
                value={best1RMDate}
                onChange={(e) => setBest1RMDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              className="input min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions, ressenti, contexte…"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-2 p-4 border-t border-border">
          {!isNew && onDelete ? (
            <button
              className="btn-ghost text-rose-400 hover:text-rose-300"
              onClick={() => {
                if (confirm("Supprimer cet override ?")) onDelete();
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
              disabled={!nom.trim()}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-text-muted uppercase tracking-wide mb-1 block">
        {label}
      </span>
      {children}
    </label>
  );
}
